import { admin, authenticated, data, headers, json } from "../_shared/core.ts";
import { AiDocumentService } from "../_shared/AiDocumentService.ts";
import { chunkText } from "../_shared/book-evidence.mjs";

async function processJob(targetJob: string | null = null) {
  const job = await data(
    targetJob
      ? admin.rpc("colearn_claim_specific_book_job", { target_job: targetJob })
      : admin.rpc("colearn_claim_book_job"),
  );
  if (!job?.id) return { idle: true };
  const finish = (
    next_stage: string | null = null,
    next_cursor = 0,
    failure: string | null = null,
  ) =>
    data(
      admin.rpc("colearn_finish_book_job", {
        job: job.id,
        token: job.lease_token,
        next_stage,
        next_cursor,
        failure,
      }),
    );
  try {
    const book = await data(
      admin.from("books").select("*").eq("id", job.book_id).single(),
    );
    if (book.status !== "APPROVED" || book.content_revision !== job.revision)
      throw new Error("Book changed or is no longer approved");
    const chapters =
      (await data(
        admin
          .from("chapters")
          .select("*")
          .eq("book_id", book.id)
          .eq("status", "PUBLISHED")
          .order("chapter_number"),
      )) || [];
    const ai = new AiDocumentService();
    if (job.kind === "summary") {
      if (!AiDocumentService.configured())
        throw new Error(
          "Configure GEMINI_API_KEY and AI_MODEL before generating summaries.",
        );
      const chapter = chapters[job.cursor - 1]; // cursor 0 is the overall book summary
      let query = admin
        .from("book_chunks")
        .select("id,content,chapter_id,page_start,page_end")
        .eq("book_id", book.id)
        .eq("generation", book.active_generation)
        .order("ordinal");
      if (chapter) query = query.eq("chapter_id", chapter.id);
      const all = (await data(query.limit(600))) || [];
      // Sample across the whole book/chapter, rather than summarizing only its opening.
      const evidence = all
        .filter(
          (_: any, i: number) =>
            i % Math.max(1, Math.ceil(all.length / 8)) === 0,
        )
        .slice(0, 8);
      if (!evidence.length)
        throw new Error(
          "No evidence for this chapter. Check chapter page boundaries and reprocess.",
        );
      const usage = await data(
        admin.rpc("colearn_reserve_book_usage", {
          viewer: job.requested_by,
          book: book.id,
          usage_kind: "summary",
          provider_name: "gemini",
          reserve: 0.03,
          budget: Number(Deno.env.get("AI_MONTHLY_BUDGET") || 5),
        }),
      );
      try {
        const summary = await ai.summarize(evidence);
        const current = await data(
          admin
            .from("books")
            .select("status,content_revision")
            .eq("id", book.id)
            .single(),
        );
        if (
          current?.status !== "APPROVED" ||
          current?.content_revision !== job.revision
        )
          throw new Error("Book changed during summary generation");
        await data(
          admin.rpc("colearn_stage_book_summary", {
            job: job.id,
            token: job.lease_token,
            chapter: chapter?.id || null,
            summary,
          }),
        );
        await data(
          admin
            .from("book_ai_usage")
            .update({
              status: "completed",
              input_tokens: summary.inputTokens,
              output_tokens: summary.outputTokens,
            })
            .eq("id", usage),
        );
      } catch (error) {
        await admin
          .from("book_ai_usage")
          .update({ status: "failed" })
          .eq("id", usage);
        throw error;
      }
      await finish(
        job.cursor < chapters.length ? "summary" : null,
        job.cursor + 1,
      );
    } else if (job.stage === "extract") {
      if (book.file_type === "pdf" && book.file_path) {
        if (
          !chapters.length ||
          chapters.some((c: any) => !c.page_start || !c.page_end)
        )
          throw new Error(
            "Review chapter titles and PDF page boundaries before processing. Automatic chapter guesses are not published.",
          );
        const file = await data(
          admin.storage.from("book-documents").download(book.file_path),
        );
        if (!file) throw new Error("Document could not be loaded");
        const { getDocumentProxy } = await import("npm:unpdf@1.4.0");
        const pdf = await getDocumentProxy(
          new Uint8Array(await file.arrayBuffer()),
          { isEvalSupported: false },
        );
        try {
          const pages = [];
          for (
            let n = job.cursor + 1;
            n <= Math.min(job.cursor + 8, pdf.numPages);
            n++
          ) {
            const page = await pdf.getPage(n),
              content = await page.getTextContent();
            const text = content.items
              .map((i: any) => i.str || "")
              .join(" ")
              .replace(/\u0000/g, "");
            pages.push({
              book_id: book.id,
              generation: job.id,
              page_number: n,
              text,
            });
          }
          await data(
            admin
              .from("book_pages")
              .upsert(pages, { onConflict: "generation,page_number" }),
          );
          await finish(
            job.cursor + 8 < pdf.numPages ? "extract" : "chunks",
            job.cursor + 8 < pdf.numPages ? job.cursor + 8 : 0,
          );
        } finally {
          await pdf.destroy();
        }
      } else {
        if (!chapters.some((c: any) => c.content.trim()))
          throw new Error(
            "Add readable chapter content. EPUB files are available as controlled downloads; automatic EPUB extraction is not enabled.",
          );
        await finish("chunks");
      }
    } else if (job.stage === "chunks") {
      const chunks: any[] = [];
      if (book.file_type === "pdf" && book.file_path) {
        const pages =
          (await data(
            admin
              .from("book_pages")
              .select("page_number,text")
              .eq("generation", job.id)
              .order("page_number")
              .limit(500),
          )) || [];
        for (const page of pages) {
          const chapter = chapters.find(
            (c: any) =>
              page.page_number >= c.page_start &&
              page.page_number <= c.page_end,
          );
          for (const content of chunkText(page.text))
            chunks.push({
              content,
              chapter_id: chapter?.id || null,
              page_start: page.page_number,
              page_end: page.page_number,
            });
        }
      } else
        for (const chapter of chapters)
          for (const content of chunkText(chapter.content))
            chunks.push({
              content,
              chapter_id: chapter.id,
              page_start: null,
              page_end: null,
            });
      if (!chunks.length)
        throw new Error(
          "No extractable text. Scanned PDFs require a text layer.",
        );
      if (chunks.length > 3000)
        throw new Error(
          "Split this document into smaller volumes before indexing.",
        );
      // Bounded writes keep requests below PostgREST and Edge memory limits.
      for (let i = 0; i < chunks.length; i += 100)
        await data(
          admin.from("book_chunks").upsert(
            chunks
              .slice(i, i + 100)
              .map((c, j) => ({
                ...c,
                book_id: book.id,
                generation: job.id,
                ordinal: i + j,
              })),
            { onConflict: "generation,ordinal" },
          ),
        );
      await finish("embed");
    } else {
      const chunks =
        (await data(
          admin
            .from("book_chunks")
            .select("id,content,ordinal")
            .eq("generation", job.id)
            .gte("ordinal", job.cursor)
            .order("ordinal")
            .limit(1),
        )) || [];
      for (const chunk of chunks)
        await data(
          admin
            .from("book_chunks")
            .update({ embedding: await ai.embed(chunk.content) })
            .eq("id", chunk.id),
        );
      await finish(
        chunks.length === 1 ? "embed" : null,
        job.cursor + chunks.length,
      );
    }
    return { job: job.id, processed: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Book processing failed";
    await finish(null, 0, message);
    return { job: job.id, failed: true, error: message };
  }
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  try {
    const cronKey = Deno.env.get("BOOK_WORKER_SECRET");
    if (!cronKey || req.headers.get("x-book-worker-secret") !== cronKey) {
      const { profile } = await authenticated(req);
      if (!profile.is_staff) return json({ error: "Staff required" }, 403);
    }
    const body = await req.json().catch(() => ({}));
    return json(await processJob(body.jobId || null));
  } catch {
    return json({ error: "Worker request failed or unauthorized" }, 403);
  }
});
