import { admin, data, json, hash } from "../_shared/core.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({});
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const b = await req.json();
    for (const k of ["name", "email", "subject", "message"])
      if (typeof b[k] !== "string" || !b[k].trim())
        return json({ error: "Complete all fields." }, 400);
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) ||
      b.email.length > 254 ||
      b.name.length > 120 ||
      b.subject.length > 200 ||
      b.message.trim().length < 10 ||
      b.message.length > 5000
    )
      return json(
        { error: "Please check your contact details and message length." },
        400,
      );
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    await data(
      admin.rpc("colearn_contact", {
        data: b,
        client_hash: await hash(ip + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
      }),
    );
    return json({ success: true }, 201);
  } catch (e) {
    return json(
      {
        error:
          (e as { message?: string }).message || "Could not send your message.",
      },
      400,
    );
  }
});
