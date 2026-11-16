import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { authorizeRemovalRun } from "../_shared/removal-auth.ts";

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  try {
    const admin = await authorizeRemovalRun(req, "prepare");
    if (!admin) return json({ error: "Administrator authorization required" }, 401);
    const parsed = z.object({ limit: z.number().int().min(1).max(200).default(100) }).strict().safeParse(await req.json());
    if (!parsed.success) return json({ error: "Invalid batch parameters" }, 400);
    const { data, error } = await admin.rpc("prepare_broker_removal_batch", { p_limit: parsed.data.limit });
    if (error) throw error;
    const { error: wakeError } = await admin.rpc("wake_broker_removal_worker", { p_mode: "worker" });
    if (wakeError) throw wakeError;
    return json({ ...data, emailed: 0, followUps: 0, errors: 0, delivery: "queued" });
  } catch (error) {
    console.error("removal preparation failed", error);
    return json({ error: "Removal preparation failed" }, 500);
  }
});
