import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { authorizeRemovalRun } from "../_shared/removal-auth.ts";
import { buildRemovalEmail, chooseMethod } from "../_shared/broker-removals.ts";
import { deliveryAllowed, retryDecision, IDEMPOTENCY_SAFE_MS, WORKER_BATCH_SIZE } from "../_shared/removal-delivery.ts";
import { RESEND_FROM, resendSenderDomain, isResendTestSender } from "../_shared/resend.ts";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  let admin: Awaited<ReturnType<typeof authorizeRemovalRun>> = null;
  const token = crypto.randomUUID();
  try {
    admin = await authorizeRemovalRun(req, "worker");
    if (!admin) return json({ error: "Administrator authorization required" }, 401);
    if (!z.object({}).strict().safeParse(await req.json()).success) return json({ error: "Invalid worker parameters" }, 400);
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ error: "Email service unavailable" }, 503);
    // Fail closed: a sending-only key without domain-read access needs an owner readiness check.
    const domains = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
    if (!domains.ok) return json({ error: "Cannot verify email-sending domain readiness" }, 503);
    const domainData = await domains.json();
    if (isResendTestSender() || !domainData.data?.some((d: { name: string; status: string }) => d.name === resendSenderDomain() && d.status === "verified"))
      return json({ error: "Email-sending domain is not verified" }, 503);
    const { data: jobs, error } = await admin.rpc("claim_broker_removal_jobs", { p_token: token, p_limit: WORKER_BATCH_SIZE });
    if (error) throw error;
    const summary = { sent: 0, failed: 0, skipped: 0, retrying: 0 };
    for (const job of jobs ?? []) {
      const patch = async (fields: Record<string, unknown>) => {
        const { error } = await admin?.from("broker_removal_jobs").update(fields).eq("id", job.id).eq("lease_token", token).eq("status", "running") ?? {};
        if (error) throw error;
      };
      let httpStatus: number | null = null;
      let retryAfter: string | null = null;
      let started = job.delivery_started_at;
      try {
        const { data: request, error: requestError } = await admin.from("broker_removal_requests").select("*").eq("id", job.request_id).single();
        if (requestError) throw requestError;
        const [{ data: subscription, error: subError }, { data: authorization, error: authError }, { data: broker, error: brokerError }, { data: profile, error: profileError }] = await Promise.all([
          admin.from("subscriptions").select("tier,status").eq("user_id", request.user_id).maybeSingle(),
          admin.from("user_authorizations").select("id,authorized_at,signature_data").eq("user_id", request.user_id).is("revoked_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          admin.from("data_brokers").select("name,privacy_email,contact_verified_at,removal_method,form_automation_enabled").eq("id", request.broker_id).single(),
          admin.from("profiles").select("email,full_name,city,state").eq("id", request.user_id).single(),
        ]);
        if (subError || authError || brokerError || profileError) throw new Error("Could not recheck delivery eligibility");
        if (!deliveryAllowed(subscription?.tier, subscription?.status, !!authorization, request.status, job.attempt, request.attempts ?? 0)) {
          await patch({ status: "cancelled", lease_until: null, last_error: "Subscription, authorization or request no longer eligible" }); summary.skipped++; continue;
        }
        if (!broker || chooseMethod(broker, false) !== "email") {
          const { error } = await admin.from("broker_removal_requests").update({ method: "form", status: "needs_customer", last_error: "Verified email no longer available; use manual queue" }).eq("id", request.id);
          if (error) throw error;
          await patch({ status: "cancelled", lease_until: null }); summary.skipped++; continue;
        }
        const fullName = (authorization?.signature_data as { full_name?: string } | null)?.full_name || profile?.full_name;
        if (!profile?.email || !fullName || !authorization) {
          await patch({ status: "failed", lease_until: null, last_error: "Customer name or contact email missing" }); summary.failed++; continue;
        }
        if (started && Date.now() - Date.parse(started) >= IDEMPOTENCY_SAFE_MS) {
          await patch({ status: "failed", lease_until: null, last_error: "Delivery outcome requires manual review; safe retry window expired" }); summary.failed++; continue;
        }
        const msg = buildRemovalEmail({ brokerName: broker.name, fullName, email: profile.email, listingUrl: request.listing_url, city: profile.city, state: profile.state, authorizedAt: authorization.authorized_at, followUp: job.attempt > 1 });
        const payload = job.payload ?? { from: RESEND_FROM, to: [broker.privacy_email], subject: msg.subject, text: msg.text, reply_to: profile.email };
        // Do not resend saved personal information after the customer's authorization/profile changes.
        if (job.payload && JSON.stringify(job.payload) !== JSON.stringify({ from: RESEND_FROM, to: [broker.privacy_email], subject: msg.subject, text: msg.text, reply_to: profile.email })) {
          await patch({ status: "failed", lease_until: null, last_error: "Delivery details changed; manual review required" }); summary.failed++; continue;
        }
        started = started ?? new Date().toISOString();
        await patch({ payload, delivery_started_at: started });
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `broker-removal/${job.id}` },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(8000),
        });
        httpStatus = response.status; retryAfter = response.headers.get("retry-after");
        if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
        const result = await response.json();
        if (!result.id) throw new Error("Provider response missing delivery ID");
        const { data: completed, error: completeError } = await admin.rpc("finish_broker_removal_job", { p_id: job.id, p_token: token, p_provider_id: result.id });
        if (completeError || !completed) throw new Error("Delivery acknowledgement could not be saved");
        summary.sent++;
      } catch (error) {
        const failures = job.failure_count + 1;
        const decision = retryDecision(failures, httpStatus && httpStatus >= 400 ? httpStatus : null, started ?? new Date().toISOString(), new Date(), retryAfter);
        await patch({ status: decision.status, available_at: decision.availableAt, failure_count: failures, lease_until: null, last_error: error instanceof Error ? error.message : "Delivery failed" });
        decision.status === "failed" ? summary.failed++ : summary.retrying++;
      }
      await sleep(1500);
    }
    return json(summary);
  } catch (error) {
    console.error("removal worker failed", error);
    return json({ error: "Removal worker failed" }, 500);
  } finally {
    if (admin) {
      await admin.from("broker_removal_worker_state").update({ lease_until: null }).eq("singleton", true).eq("lease_token", token);
      await admin.rpc("arm_broker_removal_retry");
    }
  }
});
