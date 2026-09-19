import { client, json } from "../_shared/core.ts";
import { iceConfiguration } from "../_shared/turn.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({});
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const token = req.headers.get("Authorization")?.replace(/^Bearer /i, "");
  if (!token) return json({ error: "Sign in to use calling." }, 401);
  const userClient = client();
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user)
    return json({ error: "Sign in to use calling." }, 401);
  let scope;
  try {
    scope = await req.json();
  } catch {
    return json({ error: "Invalid call request." }, 400);
  }
  if (
    !scope ||
    typeof scope !== "object" ||
    Array.isArray(scope) ||
    !!scope.callId === !!scope.projectId ||
    (scope.callId && !/^[0-9a-f-]{36}$/i.test(scope.callId)) ||
    (scope.projectId &&
      (!Number.isSafeInteger(scope.projectId) || scope.projectId < 1))
  )
    return json({ error: "Choose a valid private or project call." }, 400);
  const { createClient } = await import("npm:@supabase/supabase-js@2.116.0");
  const scoped = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const permitted = await scoped.rpc("colearn_voice_ice_access", {
    call_id: scope.callId || null,
    project_id: scope.projectId || null,
  });
  if (permitted.error)
    return json(
      {
        error:
          permitted.error.code === "42501"
            ? "You cannot join this call."
            : "Please wait before starting another call.",
      },
      permitted.error.code === "42501" ? 403 : 429,
    );
  try {
    const configuration = await iceConfiguration(data.user.id, (name) =>
      Deno.env.get(name),
    );
    const response = json(configuration);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return json(
      {
        error:
          "The audio relay is temporarily unavailable. Please try again shortly.",
      },
      503,
    );
  }
});
