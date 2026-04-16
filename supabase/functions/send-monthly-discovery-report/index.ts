import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Get all active users with email
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, last_email_scan_date');

    if (profilesError) throw profilesError;

    let reportsSent = 0;

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      // Check email preferences — skip if unsubscribed or "never"
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("token, unsubscribed, email_frequency")
        .eq("email", profile.email)
        .maybeSingle();

      if (prefs?.unsubscribed || prefs?.email_frequency === "never") {
        console.log(`Skipping ${profile.email} — unsubscribed or frequency=never`);
        continue;
      }

      // Idempotent upsert to ensure token always exists
      let prefToken = prefs?.token;
      if (!prefToken) {
        const { data: newPref } = await supabase
          .from("email_preferences")
          .upsert({ email: profile.email }, { onConflict: "email" })
          .select("token, email_frequency, unsubscribed")
          .single();
        prefToken = newPref?.token || "";
        // Re-check prefs after upsert — user may have opted out via another path
        if (newPref?.unsubscribed || newPref?.email_frequency === "never") {
          console.log(`Skipping ${profile.email} — opted out after preference row created`);
          continue;
        }
      }

      const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://footprintfinder.co";
      const unsubscribeUrl = `${appBaseUrl}/unsubscribe?token=${prefToken}`;
      const preferencesUrl = `${appBaseUrl}/preferences?token=${prefToken}`;

      // Get new discoveries from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: newServices, error: servicesError } = await supabase
        .from('user_services')
        .select(`
          *,
          service:service_catalog(name, domain, category)
        `)
        .eq('user_id', profile.id)
        .gte('discovered_at', thirtyDaysAgo.toISOString())
        .is('deletion_requested_at', null);

      if (servicesError) {
        console.error(`Error fetching services for user ${profile.id}:`, servicesError);
        continue;
      }

      // Get reappeared services (deleted but still sending emails)
      const { data: reappearedServices, error: reappearedError } = await supabase
        .from('user_services')
        .select(`
          *,
          service:service_catalog(name, domain)
        `)
        .eq('user_id', profile.id)
        .not('reappeared_at', 'is', null)
        .gte('reappeared_at', thirtyDaysAgo.toISOString());

      if (reappearedError) {
        console.error(`Error fetching reappeared services for user ${profile.id}:`, reappearedError);
      }

      const newCount = newServices?.length || 0;
      const reappearedCount = reappearedServices?.length || 0;

      // Only send if there's something to report
      if (newCount === 0 && reappearedCount === 0) {
        continue;
      }

      // Build email content
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Your Monthly Privacy Report</h1>
          <p>Hi ${profile.full_name || 'there'},</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">This Month's Activity</h2>
            ${newCount > 0 ? `
              <div style="margin: 15px 0;">
                <strong style="color: #059669; font-size: 24px;">${newCount}</strong>
                <span style="color: #4b5563;"> new services discovered</span>
              </div>
            ` : ''}
            ${reappearedCount > 0 ? `
              <div style="margin: 15px 0;">
                <strong style="color: #dc2626; font-size: 24px;">${reappearedCount}</strong>
                <span style="color: #4b5563;"> previously deleted services still emailing you</span>
              </div>
            ` : ''}
          </div>

          ${newCount > 0 ? `
            <div style="margin: 30px 0;">
              <h3>New Services Found:</h3>
              <ul style="list-style: none; padding: 0;">
                ${newServices?.slice(0, 10).map(s => `
                  <li style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <strong>${s.service?.name || s.service?.domain}</strong>
                    <span style="color: #6b7280; margin-left: 10px;">${s.service?.category || ''}</span>
                  </li>
                `).join('')}
                ${newServices && newServices.length > 10 ? `<li style="padding: 10px;">...and ${newServices.length - 10} more</li>` : ''}
              </ul>
            </div>
          ` : ''}

          ${reappearedCount > 0 ? `
            <div style="margin: 30px 0; background: #fef2f2; padding: 15px; border-radius: 8px;">
              <h3 style="color: #dc2626;">⚠️ Services Still Active</h3>
              <p style="color: #4b5563;">These services are still sending you emails even after deletion requests:</p>
              <ul>
                ${reappearedServices?.slice(0, 5).map(s => `
                  <li>${s.service?.name || s.service?.domain}</li>
                `).join('')}
              </ul>
              <p style="color: #6b7280; font-size: 14px;">Consider following up on these deletion requests.</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0; text-align: center;">
            <a href="https://footprintfinder.co/dashboard" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review New Discoveries →
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>Your digital footprint would have grown by ${Math.ceil((newCount / 200) * 100)}% this month without continuous monitoring.</p>
            <p>Keep your privacy protected with ongoing scans and deletion requests.</p>
          </div>

          <div style="margin-top: 20px; color: #9ca3af; font-size: 12px; text-align: center;">
            <p>Footprint Finder - Privacy Protection on Autopilot</p>
            <p>
              <a href="${preferencesUrl}" style="color: #9ca3af;">Email Preferences</a> | 
              <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `;

      try {
        await resend.emails.send({
          from: "Footprint Finder <reports@footprintfinder.com>",
          to: [profile.email],
          subject: `Your Monthly Privacy Report: ${newCount} New Services Found`,
          html: emailHtml,
        });

        reportsSent++;
        console.log(`Sent report to ${profile.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportsSent,
        message: `Sent ${reportsSent} monthly reports` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending monthly reports:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
