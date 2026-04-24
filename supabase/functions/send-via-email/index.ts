import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getEmailProvider } from "../_shared/email-providers/factory.ts";
import { ProviderType } from "../_shared/email-providers/types.ts";
import { decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getReconnectRequiredResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const normalizedMessage = message.toLowerCase();

  const requiresReconnect =
    normalizedMessage.includes('invalid_grant') ||
    normalizedMessage.includes('failed to refresh access token') ||
    normalizedMessage.includes('insufficient authentication scopes') ||
    normalizedMessage.includes('gmail.send') ||
    normalizedMessage.includes('token has been expired or revoked') ||
    normalizedMessage.includes('invalid credentials');

  if (!requiresReconnect) {
    return null;
  }

  return new Response(
    JSON.stringify({
      error: 'Your connected Gmail account needs to be reconnected before we can send deletion requests.',
      error_code: 'GMAIL_RECONNECT_REQUIRED',
      reconnectRequired: true,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    }
  );
}

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

    // Parse email request
    const { to, subject, body, connectionId } = await req.json();

    if (!to || !subject || !body) {
      throw new Error('Missing required email fields: to, subject, body');
    }

    console.log(`Sending email via user ${user.id}'s connection to: ${to}`);

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
      throw new Error('Email connection not found. Please connect an email account first.');
    }

    console.log(`Using ${connection.provider} connection: ${connection.email}`);

    // Get access token (decrypt if encrypted)
    let accessToken = connection.access_token;
    if (connection.tokens_encrypted) {
      if (connection.access_token_encrypted) {
        // Bytea column is populated (Outlook-style)
        const encryptedBase64 = btoa(String.fromCharCode(...connection.access_token_encrypted));
        accessToken = await decrypt(encryptedBase64);
      } else {
        // Only text column has encrypted data (Gmail-style)
        accessToken = await decrypt(connection.access_token);
      }
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(connection.token_expires_at);
    
    if (now >= expiresAt) {
      console.log('Access token expired, refreshing...');
      
      const provider = getEmailProvider(connection.provider as ProviderType);
      
      let refreshToken = connection.refresh_token;
      if (connection.tokens_encrypted) {
        if (connection.refresh_token_encrypted) {
          // Bytea column is populated (Outlook-style)
          const encryptedBase64 = btoa(String.fromCharCode(...connection.refresh_token_encrypted));
          refreshToken = encryptedBase64;
        } else {
          // Only text column has encrypted data (Gmail-style)
          refreshToken = connection.refresh_token; // Already encrypted base64
        }
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

    // Get the provider and send email
    const provider = getEmailProvider(connection.provider as ProviderType);
    await provider.sendEmail(accessToken, { to, subject, body });

    console.log(`Email sent successfully via ${connection.provider}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        provider: connection.provider,
        from: connection.email,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);

    const reconnectResponse = getReconnectRequiredResponse(error);
    if (reconnectResponse) {
      return reconnectResponse;
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
