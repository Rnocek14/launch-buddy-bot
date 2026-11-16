import { createClient } from "npm:@supabase/supabase-js@2";

export async function authorizeRemovalRun(req: Request, mode: "prepare" | "worker" | "report") {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) throw new Error("Supabase credentials unavailable");
  const admin = createClient(url, serviceKey);
  const callback = req.headers.get("x-removal-callback");
  if (callback && /^[a-f0-9-]{36}$/.test(callback)) {
    const { data, error } = await admin.rpc("consume_removal_callback", { p_token: callback, p_mode: mode });
    if (!error && data === true) return admin;
    return null;
  }
  // Scheduled callbacks use one-time opaque capabilities, never public API keys as authorization.
  const bearer = req.headers.get("Authorization");
  if (!bearer?.startsWith("Bearer ")) return null;
  const scoped = createClient(url, anonKey);
  const { data, error } = await scoped.auth.getUser(bearer.slice(7));
  if (error || !data.user) return null;
  const { data: role, error: roleError } = await admin.from("user_roles").select("user_id")
    .eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  return !roleError && role ? admin : null;
}