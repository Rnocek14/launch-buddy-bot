import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { OutlookProvider } from "../_shared/email-providers/outlook.ts";
import { getRedirectBaseUrl } from "../_shared/redirect-url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const baseUrl = getRedirectBaseUrl();

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${baseUrl}/settings?error=${encodeURIComponent('OAuth authorization failed')}` },
      });
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const userId = state;
    console.log('Processing Outlook OAuth callback for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const outlookProvider = new OutlookProvider();
    const connectionData = await outlookProvider.handleCallback(code, userId);

    console.log('Outlook callback successful, storing connection');

    const { data: existingConnection } = await supabase
      .from('email_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('email', connectionData.email)
      .eq('provider', 'outlook')
      .maybeSingle();

    if (existingConnection) {
      const { error: updateError } = await supabase
        .from('email_connections')
        .update({
          access_token: connectionData.access_token,
          refresh_token: connectionData.refresh_token,
          token_expires_at: connectionData.token_expires_at,
          tokens_encrypted: connectionData.tokens_encrypted,
          access_token_encrypted: connectionData.access_token_encrypted,
          refresh_token_encrypted: connectionData.refresh_token_encrypted,
          provider_user_id: connectionData.provider_user_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      if (updateError) throw updateError;
      console.log('Updated existing Outlook connection');
    } else {
      const { data: anyConnection } = await supabase
        .from('email_connections')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      const isPrimary = !anyConnection;

      const { error: insertError } = await supabase
        .from('email_connections')
        .insert({
          user_id: userId,
          email: connectionData.email,
          provider: 'outlook',
          access_token: connectionData.access_token,
          refresh_token: connectionData.refresh_token,
          token_expires_at: connectionData.token_expires_at,
          tokens_encrypted: connectionData.tokens_encrypted,
          access_token_encrypted: connectionData.access_token_encrypted,
          refresh_token_encrypted: connectionData.refresh_token_encrypted,
          provider_user_id: connectionData.provider_user_id,
          is_primary: isPrimary,
        });

      if (insertError) throw insertError;
      console.log('Created new Outlook connection');
    }

    return new Response(null, {
      status: 302,
      headers: { 'Location': `${baseUrl}/settings?connected=outlook` },
    });
  } catch (error) {
    console.error('Error in Outlook OAuth callback:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${baseUrl}/settings?error=${encodeURIComponent('Failed to connect Outlook account')}` },
    });
  }
});
