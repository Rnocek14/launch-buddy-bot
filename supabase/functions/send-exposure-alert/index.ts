import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const APP_URL = "https://footprintfinder.co";

interface AlertRequest {
  userId: string;
  triggerSource?: string; // 'scheduled_rescan' | 'manual_scan' | 'broker_scan'
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { userId, triggerSource = "scheduled_rescan" }: AlertRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ALERT] Computing diff for user ${userId} (source: ${triggerSource})`);

    // Find the timestamp of the last alert (or epoch if none)
    const { data: lastAlert } = await supabase
      .from("exposure_alerts")
      .select("sent_at")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sinceTs = lastAlert?.sent_at ?? "1970-01-01T00:00:00Z";
    console.log(`[ALERT] Diffing since ${sinceTs}`);

    // === DIFF: new broker exposures since last alert ===
    const { data: newBrokers, error: brokerErr } = await supabase
      .from("broker_scan_results")
      .select("id, broker_id, status_v2, updated_at, data_brokers(name)")
      .eq("user_id", userId)
      .in("status_v2", ["found", "possible_match"])
      .gt("updated_at", sinceTs);

    if (brokerErr) {
      console.error("[ALERT] Broker query error:", brokerErr);
    }

    // === DIFF: new breach findings since last alert ===
    const { data: newBreaches, error: breachErr } = await supabase
      .from("exposure_findings")
      .select("id, source_name, severity, found_at")
      .eq("user_id", userId)
      .eq("source_type", "breach")
      .gt("found_at", sinceTs);

    if (breachErr) {
      console.error("[ALERT] Breach query error:", breachErr);
    }

    const brokerCount = newBrokers?.length ?? 0;
    const breachCount = newBreaches?.length ?? 0;
    const totalNew = brokerCount + breachCount;

    console.log(`[ALERT] Diff result: ${brokerCount} brokers, ${breachCount} breaches`);

    // CRITICAL RULE: only send if something is actually new
    if (totalNew === 0) {
      console.log(`[ALERT] No new findings — skipping email`);
      return new Response(
        JSON.stringify({ sent: false, reason: "no_new_findings", brokerCount, breachCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      console.error(`[ALERT] No email for user ${userId}`);
      return new Response(
        JSON.stringify({ sent: false, reason: "no_email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check email preferences (respect unsubscribe)
    const { data: pref } = await supabase
      .from("email_preferences")
      .select("unsubscribed, email_frequency")
      .eq("email", profile.email)
      .maybeSingle();

    if (pref?.unsubscribed || pref?.email_frequency === "never") {
      console.log(`[ALERT] User ${userId} has unsubscribed — skipping`);
      return new Response(
        JSON.stringify({ sent: false, reason: "unsubscribed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build subject — high-signal, specific
    let subject: string;
    if (brokerCount > 0 && breachCount > 0) {
      subject = `${totalNew} new exposures detected`;
    } else if (brokerCount > 0) {
      subject = brokerCount === 1
        ? `Your data just reappeared on a broker`
        : `${brokerCount} brokers re-listed your data`;
    } else {
      subject = breachCount === 1
        ? `New breach detected with your data`
        : `${breachCount} new breaches detected`;
    }

    // Build email body
    const brokerList = (newBrokers ?? [])
      .slice(0, 5)
      .map((b: any) => `<li style="margin:6px 0;">${b.data_brokers?.name ?? "Unknown broker"}</li>`)
      .join("");

    const breachList = (newBreaches ?? [])
      .slice(0, 5)
      .map((b: any) => `<li style="margin:6px 0;">${escapeHtml(b.source_name)}</li>`)
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#71717a;margin-bottom:8px;">Footprint Finder · Monitoring alert</div>
          <h1 style="margin:0;font-size:24px;line-height:1.3;color:#18181b;">${subject}</h1>
        </td></tr>

        <tr><td style="padding:16px 32px 8px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
            ${profile.full_name ? `Hi ${escapeHtml(profile.full_name.split(" ")[0])},` : "Hi,"} we just finished a fresh scan of your digital footprint and found something new since your last update.
          </p>
        </td></tr>

        ${brokerCount > 0 ? `
        <tr><td style="padding:8px 32px;">
          <div style="background:#fef2f2;border-left:3px solid #dc2626;padding:14px 16px;border-radius:6px;">
            <div style="font-size:13px;font-weight:600;color:#991b1b;margin-bottom:6px;">
              ${brokerCount} broker${brokerCount > 1 ? "s" : ""} re-listed your data
            </div>
            <ul style="margin:6px 0 0;padding-left:20px;font-size:14px;color:#3f3f46;">${brokerList}</ul>
            ${(newBrokers?.length ?? 0) > 5 ? `<div style="font-size:12px;color:#71717a;margin-top:6px;">+ ${newBrokers!.length - 5} more</div>` : ""}
          </div>
        </td></tr>` : ""}

        ${breachCount > 0 ? `
        <tr><td style="padding:8px 32px;">
          <div style="background:#fffbeb;border-left:3px solid #d97706;padding:14px 16px;border-radius:6px;">
            <div style="font-size:13px;font-weight:600;color:#92400e;margin-bottom:6px;">
              ${breachCount} new breach${breachCount > 1 ? "es" : ""} detected
            </div>
            <ul style="margin:6px 0 0;padding-left:20px;font-size:14px;color:#3f3f46;">${breachList}</ul>
            ${(newBreaches?.length ?? 0) > 5 ? `<div style="font-size:12px;color:#71717a;margin-top:6px;">+ ${newBreaches!.length - 5} more</div>` : ""}
          </div>
        </td></tr>` : ""}

        <tr><td style="padding:24px 32px 8px;" align="center">
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">Review changes</a>
        </td></tr>

        <tr><td style="padding:24px 32px 32px;">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#71717a;">
            We only send this email when something actually changes — no noise, no weekly digests.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px 24px;border-top:1px solid #f4f4f5;">
          <p style="margin:16px 0 0;font-size:11px;line-height:1.5;color:#a1a1aa;">
            You're receiving this because you set up monitoring on Footprint Finder.
            <a href="${APP_URL}/settings" style="color:#71717a;text-decoration:underline;">Manage alerts</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send via Resend
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const result = await resend.emails.send({
        from: "Footprint Finder <onboarding@resend.dev>",
        to: [profile.email],
        subject,
        html,
      });

      if ((result as any).error) {
        emailError = JSON.stringify((result as any).error);
        console.error(`[ALERT] Resend error:`, emailError);
      } else {
        emailSent = true;
        console.log(`[ALERT] Email sent to ${profile.email}, id: ${(result as any).data?.id}`);
      }
    } catch (e: any) {
      emailError = e?.message ?? String(e);
      console.error(`[ALERT] Send exception:`, emailError);
    }

    // Record the alert (this becomes the new baseline for next diff)
    await supabase.from("exposure_alerts").insert({
      user_id: userId,
      new_broker_ids: (newBrokers ?? []).map((b: any) => b.broker_id),
      new_breach_names: (newBreaches ?? []).map((b: any) => b.source_name),
      new_broker_count: brokerCount,
      new_breach_count: breachCount,
      email_sent: emailSent,
      email_error: emailError,
      trigger_source: triggerSource,
    });

    return new Response(
      JSON.stringify({
        sent: emailSent,
        brokerCount,
        breachCount,
        error: emailError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ALERT] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
