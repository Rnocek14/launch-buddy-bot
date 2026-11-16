import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { RESEND_FROM } from "../_shared/resend.ts";
import {
  buildRemovalEmail, chooseMethod, followUpDate, isEligible, nextAction, statusAfterRescan,
  type ExistingRequest,
} from "../_shared/broker-removals.ts";

// Brokers with a tested automatic form submitter. Empty until each one is verified.
const AUTO_FORM_ADAPTERS: Record<string, unknown> = {};
const DELAY_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sendEmail(to: string, subject: string, text: string, replyTo: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY missing");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, text, reply_to: replyTo }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date();
  const summary = { users: 0, emailed: 0, followUps: 0, queued: 0, removed: 0, errors: 0 };

  try {
    const { data: subs, error: subErr } = await supabase
      .from("subscriptions").select("user_id, tier, status")
      .eq("tier", "complete").in("status", ["active", "trialing"]);
    if (subErr) throw subErr;

    for (const sub of subs ?? []) {
      const { data: authz } = await supabase.from("user_authorizations")
        .select("authorized_at, signature_data").eq("user_id", sub.user_id).is("revoked_at", null)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!isEligible(sub.tier, !!authz)) continue;
      summary.users++;

      const { data: profile } = await supabase.from("profiles")
        .select("email, full_name, city, state").eq("id", sub.user_id).maybeSingle();
      const fullName = (authz!.signature_data as any)?.full_name || profile?.full_name;
      const email = profile?.email;
      if (!fullName || !email) continue;

      const { data: results } = await supabase.from("broker_scan_results")
        .select("id, broker_id, status_v2, scanned_at, profile_url, evidence_url, data_brokers(name, slug, privacy_email, removal_method, form_automation_enabled, contact_verified_at)")
        .eq("user_id", sub.user_id);
      const { data: existingRows } = await supabase.from("broker_removal_requests")
        .select("*").eq("user_id", sub.user_id);
      const existingByBroker = new Map((existingRows ?? []).map((r: any) => [r.broker_id, r]));

      for (const r of results ?? []) {
        const broker = (r as any).data_brokers;
        if (!broker) continue;
        const existing = existingByBroker.get(r.broker_id) as (ExistingRequest & { id: string }) | undefined;

        // 1. Re-check proof for requests already sent.
        if (existing) {
          const newStatus = statusAfterRescan(existing, r);
          if (newStatus !== existing.status) {
            await supabase.from("broker_removal_requests").update({ status: newStatus }).eq("id", existing.id);
            existing.status = newStatus;
            if (newStatus === "removed") summary.removed++;
          }
        }
        if (!existing && r.status_v2 !== "found") continue;

        const method = existing?.method ?? chooseMethod(broker, !!AUTO_FORM_ADAPTERS[broker.slug]);
        const action = nextAction(method, existing ?? null, now);
        const listingUrl = r.evidence_url || r.profile_url;

        try {
          if (action === "send_email" || action === "follow_up") {
            const msg = buildRemovalEmail({
              brokerName: broker.name, fullName, email, listingUrl, city: profile?.city, state: profile?.state,
              authorizedAt: authz!.authorized_at, followUp: action === "follow_up",
            });
            await sendEmail(broker.privacy_email, msg.subject, msg.text, email);
            const fields = {
              status: "request_sent", sent_at: now.toISOString(), follow_up_at: followUpDate(now),
              attempts: (existing?.attempts ?? 0) + 1, last_error: null,
            };
            if (existing) await supabase.from("broker_removal_requests").update(fields).eq("id", existing.id);
            else await supabase.from("broker_removal_requests").insert({
              user_id: sub.user_id, broker_id: r.broker_id, scan_result_id: r.id, method: "email", listing_url: listingUrl, ...fields,
            });
            action === "follow_up" ? summary.followUps++ : summary.emailed++;
            await sleep(DELAY_MS);
          } else if (action === "queue_form" || action === "auto_form") {
            // No automatic submitter is verified yet, so auto_form also lands in the manual queue.
            await supabase.from("broker_removal_requests").insert({
              user_id: sub.user_id, broker_id: r.broker_id, scan_result_id: r.id, method: "form",
              listing_url: listingUrl, status: "found",
            });
            summary.queued++;
          }
        } catch (e) {
          summary.errors++;
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`removal failed user=${sub.user_id} broker=${broker.slug}: ${msg}`);
          if (existing) await supabase.from("broker_removal_requests").update({ last_error: msg }).eq("id", existing.id);
        }
      }
    }
    console.log("send-broker-removals", JSON.stringify(summary));
    return json(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-broker-removals fatal", msg);
    return json({ error: msg, ...summary }, 500);
  }
});
