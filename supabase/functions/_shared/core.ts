import { createClient } from "npm:@supabase/supabase-js@2.116.0";
export const url = Deno.env.get("SUPABASE_URL")!;
export const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const client = () =>
  createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
export const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
export async function data<T>(
  q: PromiseLike<{ data: T; error: unknown }>,
): Promise<T> {
  const r = await q;
  if (r.error) throw r.error;
  return r.data;
}
export async function authenticated(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new Error("Authentication required");
  const { user } = await data(admin.auth.getUser(token));
  if (!user) throw new Error("Authentication required");
  const p = await data(
    admin.from("profiles").select("*").eq("id", user.id).single(),
  );
  if (!p?.is_active) throw new Error("Account is inactive");
  return { user, profile: p };
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
