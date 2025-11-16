import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailProvider } from "../_shared/email-providers/factory.ts";
import { ProviderType } from "../_shared/email-providers/types.ts";
import { decrypt } from "../_shared/encryption.ts";

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get parameters from request
    const { connectionId, maxResults = 100, after, query } = await req.json().catch(() => ({}));

    console.log(`Scanning email for user: ${user.id}, connectionId: ${connectionId || 'primary'}`);

    // Get the email connection
    let connectionQuery = supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id);

    if (connectionId) {
      connectionQuery = connectionQuery.eq('id', connectionId);
    } else {
      // Get primary connection
      connectionQuery = connectionQuery.eq('is_primary', true);
    }

    const { data: connection, error: connectionError } = await connectionQuery.maybeSingle();

    if (connectionError || !connection) {
      throw new Error('Email connection not found');
    }

    console.log(`Using ${connection.provider} connection: ${connection.email}`);

    // Get access token (decrypt if encrypted)
    let accessToken = connection.access_token;
    if (connection.tokens_encrypted && connection.access_token_encrypted) {
      const encryptedBase64 = btoa(String.fromCharCode(...connection.access_token_encrypted));
      accessToken = await decrypt(encryptedBase64);
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(connection.token_expires_at);
    
    if (now >= expiresAt) {
      console.log('Access token expired, refreshing...');
      
      // Get the provider
      const provider = getEmailProvider(connection.provider as ProviderType);
      
      // Refresh token
      let refreshToken = connection.refresh_token;
      if (connection.tokens_encrypted && connection.refresh_token_encrypted) {
        const encryptedBase64 = btoa(String.fromCharCode(...connection.refresh_token_encrypted));
        refreshToken = encryptedBase64;
      }

      const tokenData = await provider.refreshToken(
        refreshToken,
        user.id,
        connection.tokens_encrypted || false
      );

      // Update connection with new token
      const { error: updateError } = await supabase
        .from('email_connections')
        .update({
          access_token: tokenData.access_token,
          token_expires_at: tokenData.expires_at,
        })
        .eq('id', connection.id);

      if (updateError) {
        console.error('Error updating token:', updateError);
      }

      accessToken = tokenData.access_token;
    }

    // Get the provider and scan messages
    const provider = getEmailProvider(connection.provider as ProviderType);
    const messages = await provider.getMessages(accessToken, {
      maxResults,
      after,
      query,
    });

    console.log(`Scanned ${messages.length} messages from ${connection.provider}`);

    return new Response(
      JSON.stringify({ 
        messages,
        provider: connection.provider,
        email: connection.email,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error scanning email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
