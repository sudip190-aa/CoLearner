import { admin, authenticated, data, headers, json } from "../_shared/core.ts";
import { AiDocumentService } from "../_shared/AiDocumentService.ts";
import {
  educationalDisclaimer,
  UNCERTAIN,
  validateFileMetadata,
  verifyZipChecksums,
} from "../_shared/book-evidence.mjs";

const MAX_BYTES =
  Math.min(20, Number(Deno.env.get("MAX_BOOK_FILE_SIZE_MB") || 20)) * 1048576;
async function accessible(id: number, staff: boolean) {
  const b = await data(admin.from("books").select("*").eq("id", id).single());
  if (!b || (!staff && b.status !== "APPROVED"))
    throw new Error("Book unavailable");
  return b;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  try {
    const { user, profile } = await authenticated(req);
    const multipart = req.headers
      .get("content-type")
      ?.includes("multipart/form-data");
    const body = multipart
      ? Object.fromEntries((await req.formData()).entries())
      : await req.json();
    const b = await accessible(Number(body.bookId), profile.is_staff);
    if (body.action === "delete") {
      if (!profile.is_staff) return json({ error: "Staff required" }, 403);
      await data(admin.from("books").delete().eq("id", b.id));
      if (b.file_path)
        await data(admin.storage.from("book-documents").remove([b.file_path]));
      return json({ success: true });
    }
    if (body.action === "upload") {
      if (!profile.is_staff) return json({ error: "Staff required" }, 403);
      const file = body.file;
      if (!(file instanceof File)) throw new Error("Choose a PDF or EPUB");
      const { ext, name } = validateFileMetadata(
        file.name,
        file.type,
        file.size,
        MAX_BYTES,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      let pages = 0;
      let suggestedChapters: {
        title: string;
        pageStart: number;
        pageEnd: number;
      }[] = [];
      if (ext === "pdf") {
        if (
          new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-" ||
          !new TextDecoder().decode(bytes.slice(-2048)).includes("%%EOF")
        )
          throw new Error("Invalid or incomplete PDF");
        const { getDocumentProxy } = await import("npm:unpdf@1.4.0");
        const doc = await getDocumentProxy(bytes.slice(), {
          isEvalSupported: false,
        });
        try {
          pages = doc.numPages;
          if (pages > 500)
            throw new Error("Split PDFs over 500 pages into smaller volumes.");
          if ((await doc.getJSActions()) || (await doc.getAttachments()))
            throw new Error(
              "Remove PDF scripts and attachments before uploading.",
            );
          const outline = (await doc.getOutline()) || [];
          const starts: { title: string; pageStart: number }[] = [];
          for (const item of outline.slice(0, 50)) {
            const dest =
              typeof item.dest === "string"
                ? await doc.getDestination(item.dest)
                : item.dest;
            if (!dest?.length) continue;
            const pageStart =
              typeof dest[0] === "number"
                ? dest[0] + 1
                : (await doc.getPageIndex(dest[0])) + 1;
            if (
              pageStart >= 1 &&
              pageStart <= pages &&
              !starts.some((c) => c.pageStart === pageStart)
            )
              starts.push({
                title: String(item.title).slice(0, 200),
                pageStart,
              });
          }
          starts.sort((a, b) => a.pageStart - b.pageStart);
          suggestedChapters = starts.map((c, i) => ({
            ...c,
            pageEnd: starts[i + 1] ? starts[i + 1].pageStart - 1 : pages,
          }));
        } finally {
          await doc.destroy();
        }
      } else {
        const { unzipSync } = await import("npm:fflate@0.8.2");
        let expanded = 0;
        const entries = unzipSync(bytes, {
          filter: (entry) => {
            expanded += entry.originalSize;
            if (expanded > 40 * 1048576 || /(^\/|\.\.|\\)/.test(entry.name))
              throw new Error("Unsafe EPUB archive");
            return true;
          },
        });
        if (
          new TextDecoder().decode(entries.mimetype) !==
            "application/epub+zip" ||
          !entries["META-INF/container.xml"]
        )
          throw new Error("Invalid EPUB container");
        verifyZipChecksums(bytes, entries);
        const container = new TextDecoder().decode(
          entries["META-INF/container.xml"],
        );
        const root = container.match(/full-path\s*=\s*["']([^"']+)["']/)?.[1];
        if (
          !root ||
          !entries[root] ||
          !/<package\b/.test(new TextDecoder().decode(entries[root]))
        )
          throw new Error("EPUB package document is missing");
      }
      const checksum = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      )
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      const path = `${b.id}/${crypto.randomUUID()}.${ext}`;
      await data(
        admin.storage
          .from("book-documents")
          .upload(path, bytes, { contentType: file.type }),
      );
      try {
        await data(
          admin
            .from("books")
            .update({
              file_path: path,
              file_name: name,
              file_type: ext,
              file_size: file.size,
              file_checksum: checksum,
              total_pages: pages,
              status: "PENDING_REVIEW",
              redistribution_confirmed: false,
              in_app_permission_confirmed: false,
            })
            .eq("id", b.id),
        );
      } catch (error) {
        await admin.storage.from("book-documents").remove([path]);
        throw error;
      }
      if (b.file_path)
        await admin.storage.from("book-documents").remove([b.file_path]);
      await data(
        admin
          .from("book_audit")
          .insert({
            book_id: b.id,
            actor_id: user.id,
            action: "UPLOAD",
            details: { name, checksum, pages },
          }),
      );
      return json({ success: true, pages, checksum, suggestedChapters });
    }
    if (body.action === "file") {
      if (!b.file_path) throw new Error("No document attached");
      if (
        !profile.is_staff &&
        !b.redistribution_confirmed &&
        (body.download ||
          b.file_type === "epub" ||
          !b.in_app_permission_confirmed)
      )
        return json(
          { error: "Redistribution is not permitted for this document" },
          403,
        );
      const link = await data(
        admin.storage
          .from("book-documents")
          .createSignedUrl(
            b.file_path,
            120,
            body.download ? { download: b.file_name } : undefined,
          ),
      );
      if (!link) throw new Error("Document link unavailable");
      return json({ url: link.signedUrl, type: b.file_type, expiresIn: 120 });
    }
    if (body.action === "status")
      return json({
        configured: AiDocumentService.configured(),
        indexed: Boolean(b.active_generation),
        status: b.ai_status,
      });
    if (body.action !== "ask") return json({ error: "Unknown action" }, 400);
    if (b.status !== "APPROVED")
      return json({ error: "Book unavailable" }, 403);
    const question = String(body.question || "").trim();
    if (question.length < 2 || question.length > 1500)
      throw new Error("Ask a question between 2 and 1,500 characters.");
    if (body.chapterId) {
      const c = await data(
        admin
          .from("chapters")
          .select("id")
          .eq("id", body.chapterId)
          .eq("book_id", b.id)
          .eq("status", "PUBLISHED")
          .maybeSingle(),
      );
      if (!c) throw new Error("Chapter does not belong to this book");
    }
    if (!AiDocumentService.configured())
      return json(
        {
          error:
            "The book assistant is not configured yet. You can continue reading and saving progress.",
          code: "not_configured",
        },
        503,
      );
    if (!b.active_generation)
      return json(
        {
          error: "This book is waiting for processing. Please try again later.",
        },
        409,
      );
    let conversation;
    if (body.conversationId) {
      conversation = await data(
        admin
          .from("book_conversations")
          .select("id")
          .eq("id", body.conversationId)
          .eq("user_id", user.id)
          .eq("book_id", b.id)
          .maybeSingle(),
      );
      if (!conversation)
        return json({ error: "Conversation unavailable" }, 403);
    }
    const usage = await data(
      admin.rpc("colearn_reserve_book_usage", {
        viewer: user.id,
        book: b.id,
        usage_kind: "question",
        provider_name: "gemini",
        reserve: 0.03,
        budget: Number(Deno.env.get("AI_MONTHLY_BUDGET") || 5),
      }),
    );
    try {
      const ai = new AiDocumentService();
      const pageQuestion = question.match(/\bpages?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i);
      let useful;
      if (pageQuestion) {
        const start=Number(pageQuestion[1]),end=Number(pageQuestion[2]||pageQuestion[1]);
        useful=start>=1&&end>=start&&end<=b.total_pages ? (await data(admin.from('book_chunks').select('id,content,chapter_id,page_start,page_end').eq('book_id',b.id).eq('generation',b.active_generation).lte('page_start',end).gte('page_end',start).order('ordinal').limit(6))) || [] : [];
      } else {
        const embedding = await ai.embed(question);
        const evidence = await data(admin.rpc("colearn_book_retrieve", {book:b.id,question,query_embedding:embedding,chapter:body.chapterId||null,row_limit:6}));
        useful=evidence.filter((c:any)=>c.score>=0.32);
      }
      const answer = useful.length
        ? await ai.answer(question, useful)
        : { answer: UNCERTAIN, citations: [], inputTokens: 0, outputTokens: 0 };
      answer.answer += educationalDisclaimer(question);
      // Recheck availability after the external call; a takedown must not publish another answer.
      await accessible(b.id, false);
      if (!conversation)
        conversation = await data(
          admin
            .from("book_conversations")
            .insert({
              book_id: b.id,
              user_id: user.id,
              title: question.slice(0, 90),
            })
            .select("id")
            .single(),
        );
      if (!conversation) throw new Error("Conversation could not be saved");
      await data(
        admin.from("book_messages").insert([
          { conversation_id: conversation.id, role: "user", content: question },
          {
            conversation_id: conversation.id,
            role: "assistant",
            content: answer.answer,
            citations: answer.citations,
          },
        ]),
      );
      await data(
        admin
          .from("book_ai_usage")
          .update({
            status: "completed",
            input_tokens: answer.inputTokens,
            output_tokens: answer.outputTokens,
          })
          .eq("id", usage),
      );
      return json({
        conversationId: conversation.id,
        answer: answer.answer,
        citations: answer.citations,
      });
    } catch (error) {
      await admin
        .from("book_ai_usage")
        .update({ status: "failed" })
        .eq("id", usage);
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Book request failed";
    return json(
      { error: message },
      /Authentication|inactive/.test(message)
        ? 401
        : /Staff|unavailable/.test(message)
          ? 403
          : /Too many|budget|limit reached/.test(message)
            ? 429
            : 400,
    );
  }
});
