import {
  admin,
  client,
  data,
  authenticated,
  json,
  hash,
} from "../_shared/core.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({});
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const b = await req.json();
    if (b.action === "legacy-login") {
      if (typeof b.email !== "string" || typeof b.password !== "string")
        return json({ error: "Invalid credentials" }, 401);
      await data(
        admin.rpc("colearn_auth_attempt", {
          key_hash: await hash(b.email.toLowerCase()),
        }),
      );
      const legacy = await data(
        admin.rpc("colearn_legacy_hash", { email_address: b.email }),
      );
      if (!legacy) return json({ error: "Invalid email or password" }, 401);
      const [algorithm, iterations, salt, expected] = legacy.hash.split("$");
      if (algorithm !== "pbkdf2_sha256")
        return json(
          { error: "Please reset your password to access this account." },
          401,
        );
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(b.password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );
      const bits = new Uint8Array(
        await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: new TextEncoder().encode(salt),
            iterations: Number(iterations),
            hash: "SHA-256",
          },
          key,
          256,
        ),
      );
      const actual = btoa(String.fromCharCode(...bits));
      let mismatch = actual.length ^ expected.length;
      for (let i = 0; i < actual.length; i++)
        mismatch |= actual.charCodeAt(i) ^ (expected.charCodeAt(i) || 0);
      if (mismatch) return json({ error: "Invalid email or password" }, 401);
      const p = await data(
        admin.from("profiles").select("is_active").eq("id", legacy.id).single(),
      );
      if (!p.is_active) return json({ error: "Account is inactive" }, 403);
      if (
        !(await data(
          admin.rpc("colearn_claim_legacy", {
            user_uuid: legacy.id,
            expected_hash: legacy.hash,
          }),
        ))
      )
        return json({ error: "Password changed. Please sign in again." }, 401);
      await data(
        admin.auth.admin.updateUserById(legacy.id, { password: b.password }),
      );
      const logged = await data(
        client().auth.signInWithPassword({
          email: b.email,
          password: b.password,
        }),
      );
      return json(logged);
    }
    const actor = await authenticated(req);
    if (b.action === "delete-self") {
      if (!b.password) return json({ error: "Password required" }, 400);
      await data(
        client().auth.signInWithPassword({
          email: actor.user.email!,
          password: b.password,
        }),
      );
      await data(admin.auth.admin.deleteUser(actor.user.id));
      return json({ success: true });
    }
    if (!actor.profile.is_staff)
      return json({ error: "Staff access required" }, 403);
    if (b.action === "list-users") {
      const params = b.params || {};
      if (params.status === "active") params.is_active = true;
      if (params.status === "banned") params.is_active = false;
      const page = Math.max(1, Number(params.page) || 1),
        size = Math.min(100, Number(params.page_size) || 20);
      let q = admin
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (params.role) q = q.eq("role", params.role);
      if (params.is_active !== undefined && params.is_active !== "")
        q = q.eq("is_active", String(params.is_active) === "true");
      if (params.q) {
        const search = String(params.q)
          .toLowerCase()
          .replace(/[,()%]/g, "");
        const matchingEmails: string[] = [];
        for (let authPage = 1; ; authPage++) {
          const batch = await data(
            admin.auth.admin.listUsers({ page: authPage, perPage: 1000 }),
          );
          matchingEmails.push(
            ...batch.users
              .filter((u) => u.email?.toLowerCase().includes(search))
              .map((u) => u.id),
          );
          if (batch.users.length < 1000) break;
        }
        q = q.or(
          `username.ilike.%${search}%,full_name.ilike.%${search}%${matchingEmails.length ? ",id.in.(" + matchingEmails.join(",") + ")" : ""}`,
        );
      }
      const r = await q.range((page - 1) * size, page * size - 1);
      if (r.error) throw r.error;
      const results = await Promise.all(
        (r.data || []).map(async (p) => ({
          ...p,
          email: (await data(admin.auth.admin.getUserById(p.id))).user.email,
        })),
      );
      return json({
        results,
        count: r.count,
        page,
        pages: Math.max(1, Math.ceil((r.count || 0) / size)),
        page_size: size,
      });
    }
    if (b.action === "create-user") {
      if (b.role === "admin" && !actor.profile.is_superuser)
        throw new Error("Only a super administrator may assign admin roles");
      const { user } = await data(
        admin.auth.admin.createUser({
          email: b.email,
          password: b.password || undefined,
          email_confirm: true,
          user_metadata: { username: b.username, full_name: b.full_name },
        }),
      );
      const p = await data(
        admin
          .from("profiles")
          .update({ role: b.role || "learner" })
          .eq("id", user!.id)
          .select()
          .single(),
      );
      return json({ ...p, email: user!.email });
    }
    const target = await data(
      admin.from("profiles").select("*").eq("id", b.id).single(),
    );
    if (
      target.id === actor.user.id ||
      target.is_superuser ||
      (target.is_staff && !actor.profile.is_superuser)
    )
      throw new Error("This administrator cannot be modified");
    if (b.action === "delete-user") {
      await data(admin.auth.admin.deleteUser(b.id));
      return json({ success: true });
    }
    if (b.action === "update-user") {
      if (b.role === "admin" && !actor.profile.is_superuser)
        throw new Error("Only a super administrator may assign admin roles");
      if (b.is_active !== undefined)
        await data(
          admin.auth.admin.updateUserById(b.id, {
            ban_duration: b.is_active ? "none" : "876000h",
          }),
        );
      const changes = Object.fromEntries(
        Object.entries(b).filter(([k]) => ["role", "is_active"].includes(k)),
      );
      const p = await data(
        admin.from("profiles").update(changes).eq("id", b.id).select().single(),
      );
      return json({
        ...p,
        email: (await data(admin.auth.admin.getUserById(b.id))).user.email,
      });
    }
    return json({ error: "Unknown operation" }, 400);
  } catch (e) {
    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : (e as { message?: string }).message || "Request failed",
      },
      400,
    );
  }
});
