import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { encrypt } from "../_shared/encryption.ts";
import { detectTokenEncryption } from "../_shared/token-validator.ts";
import { getRedirectBaseUrl } from "../_shared/redirect-url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const baseUrl = getRedirectBaseUrl();

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Missing authorization code')}` },
      });
    }

    console.log("Processing OAuth callback for user:", state);

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-oauth-callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Unable to connect Gmail. Please try again.')}` },
      });
    }

    const tokens = await tokenResponse.json();
    console.log("Received tokens, expires_in:", tokens.expires_in);

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error("Failed to fetch user profile:", error);
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Unable to retrieve account information')}` },
      });
    }

    const profile = await profileResponse.json();
    console.log("Retrieved user profile:", profile);

    if (!profile.email) {
      console.error("No email in profile response:", profile);
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Email not available from Google')}` },
      });
    }

    console.log("Retrieved user email:", profile.email);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    console.log("Encrypting tokens with validation...");
    
    let encryptedAccessToken: string;
    let encryptedRefreshToken: string | null;
    let tokensEncrypted = true;
    
    try {
      encryptedAccessToken = await encrypt(tokens.access_token);
      encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;
      
      const accessDetection = detectTokenEncryption(encryptedAccessToken, 'gmail');
      const refreshDetection = encryptedRefreshToken 
        ? detectTokenEncryption(encryptedRefreshToken, 'gmail')
        : { isEncrypted: true, confidence: 'high', reason: 'No refresh token' };
      
      if (!accessDetection.isEncrypted) {
        throw new Error(`Access token encryption validation failed: ${accessDetection.reason}`);
      }
      
      if (encryptedRefreshToken && !refreshDetection.isEncrypted) {
        throw new Error(`Refresh token encryption validation failed: ${refreshDetection.reason}`);
      }
      
      console.log("✅ Tokens encrypted and validated successfully", {
        accessTokenLength: encryptedAccessToken.length,
        refreshTokenLength: encryptedRefreshToken?.length,
        accessConfidence: accessDetection.confidence,
        refreshConfidence: refreshDetection.confidence,
      });
      
    } catch (encryptError) {
      console.error('❌ Token encryption or validation failed:', encryptError);
      
      const plainAccessDetection = detectTokenEncryption(tokens.access_token, 'gmail');
      const plainRefreshDetection = tokens.refresh_token 
        ? detectTokenEncryption(tokens.refresh_token, 'gmail')
        : { isEncrypted: false, confidence: 'high', reason: 'No refresh token' };
      
      if (plainAccessDetection.isEncrypted || (tokens.refresh_token && plainRefreshDetection.isEncrypted)) {
        console.error('CRITICAL: Original tokens from Google appear encrypted!');
        return new Response(null, {
          status: 302,
          headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Token format error - please try reconnecting')}` },
        });
      }
      
      encryptedAccessToken = tokens.access_token;
      encryptedRefreshToken = tokens.refresh_token || null;
      tokensEncrypted = false;
      console.warn('⚠️ Storing tokens as plain text due to encryption failure');
    }

    const { data: existingConnection } = await supabase
      .from("email_connections")
      .select("id")
      .eq("user_id", state)
      .eq("email", profile.email)
      .single();

    if (existingConnection) {
      console.log("Account already connected, updating tokens");
      const { error: updateError } = await supabase
        .from("email_connections")
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiresAt.toISOString(),
          tokens_encrypted: tokensEncrypted,
        })
        .eq("id", existingConnection.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        return new Response(null, {
          status: 302,
          headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Failed to update Gmail connection')}` },
        });
      }
    } else {
      const { count } = await supabase
        .from("email_connections")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", state);

      const isFirstConnection = !count || count === 0;

      const { error: insertError } = await supabase
        .from("email_connections")
        .insert({
          user_id: state,
          email: profile.email,
          provider: 'gmail',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiresAt.toISOString(),
          tokens_encrypted: tokensEncrypted,
          is_primary: isFirstConnection,
          account_label: profile.email,
        });

      if (insertError) {
        console.error("Database insert error:", insertError);
        return new Response(null, {
          status: 302,
          headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Failed to save Gmail connection')}` },
        });
      }

      console.log(`✅ New Gmail account connected${isFirstConnection ? ' (set as primary)' : ''}`);
    }

    console.log("Gmail connection stored successfully");

    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/settings?gmail=connected` },
    });
  } catch (error: any) {
    console.error("Error in gmail-oauth-callback:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/settings?error=${encodeURIComponent('Failed to connect Gmail account')}` },
    });
  }
});
