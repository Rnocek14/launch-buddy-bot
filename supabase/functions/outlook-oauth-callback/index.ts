import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OutlookProvider } from "../_shared/email-providers/outlook.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This is the user_id
    const error = url.searchParams.get('error');

    // Get the origin from the request
    const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
    const baseUrl = new URL(origin).origin;

    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${baseUrl}/settings?error=${encodeURIComponent('OAuth authorization failed')}`,
        },
      });
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const userId = state;
    console.log('Processing Outlook OAuth callback for user:', userId);

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use Outlook provider to handle the callback
    const outlookProvider = new OutlookProvider();
    const connectionData = await outlookProvider.handleCallback(code, userId);

    console.log('Outlook callback successful, storing connection');

    // Check if user already has an Outlook connection
    const { data: existingConnection } = await supabase
      .from('email_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('email', connectionData.email)
      .eq('provider', 'outlook')
      .maybeSingle();

    if (existingConnection) {
      // Update existing connection
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
      // Check if user has any email connections
      const { data: anyConnection } = await supabase
        .from('email_connections')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      // If this is the first connection, make it primary
      const isPrimary = !anyConnection;

      // Insert new connection
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

    // Redirect to settings page with success message
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/settings?connected=outlook`,
      },
    });
  } catch (error) {
    console.error('Error in Outlook OAuth callback:', error);
    const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
    const baseUrl = new URL(origin).origin;
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/settings?error=${encodeURIComponent('Failed to connect Outlook account')}`,
      },
    });
  }
});
