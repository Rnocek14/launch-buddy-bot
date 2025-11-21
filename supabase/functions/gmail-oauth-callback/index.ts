import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { encrypt } from "../_shared/encryption.ts";
import { detectTokenEncryption } from "../_shared/token-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // Contains user_id

    if (!code || !state) {
      const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
      const baseUrl = new URL(origin).origin;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${baseUrl}/settings?error=${encodeURIComponent('Missing authorization code')}`,
        },
      });
    }

    console.log("Processing OAuth callback for user:", state);

    // Exchange code for tokens
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
      const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
      const baseUrl = new URL(origin).origin;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${baseUrl}/settings?error=${encodeURIComponent('Unable to connect Gmail. Please try again.')}`,
        },
      });
    }

    const tokens = await tokenResponse.json();
    console.log("Received tokens, expires_in:", tokens.expires_in);

    // Get user's email from Google
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error("Failed to fetch user profile:", error);
      const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
      const baseUrl = new URL(origin).origin;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${baseUrl}/settings?error=${encodeURIComponent('Unable to retrieve account information')}`,
        },
      });
    }

    const profile = await profileResponse.json();
    console.log("Retrieved user profile:", profile);

    if (!profile.email) {
      console.error("No email in profile response:", profile);
      const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
      const baseUrl = new URL(origin).origin;
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${baseUrl}/settings?error=${encodeURIComponent('Email not available from Google')}`,
        },
      });
    }

    console.log("Retrieved user email:", profile.email);

    // Store tokens in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // === LAYER 3: HARDENED TOKEN ENCRYPTION WITH VALIDATION ===
    console.log("Encrypting tokens with validation...");
    
    let encryptedAccessToken: string;
    let encryptedRefreshToken: string | null;
    let tokensEncrypted = true;
    
    try {
      // Step 1: Encrypt tokens
      encryptedAccessToken = await encrypt(tokens.access_token);
      encryptedRefreshToken = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null;
      
      // Step 2: VALIDATE what we just encrypted
      const accessDetection = detectTokenEncryption(encryptedAccessToken, 'gmail');
      const refreshDetection = encryptedRefreshToken 
        ? detectTokenEncryption(encryptedRefreshToken, 'gmail')
        : { isEncrypted: true, confidence: 'high', reason: 'No refresh token' };
      
      // Step 3: Verify encryption worked correctly
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
        accessReason: accessDetection.reason,
        refreshReason: refreshDetection.reason
      });
      
    } catch (encryptError) {
      console.error('❌ Token encryption or validation failed:', encryptError);
      
      // Fallback: Store plain text BUT validate it's actually plain
      const plainAccessDetection = detectTokenEncryption(tokens.access_token, 'gmail');
      const plainRefreshDetection = tokens.refresh_token 
        ? detectTokenEncryption(tokens.refresh_token, 'gmail')
        : { isEncrypted: false, confidence: 'high', reason: 'No refresh token' };
      
      if (plainAccessDetection.isEncrypted || (tokens.refresh_token && plainRefreshDetection.isEncrypted)) {
        // This should NEVER happen - original tokens from Google shouldn't be encrypted
        console.error('CRITICAL: Original tokens from Google appear encrypted!', {
          accessDetection: plainAccessDetection,
          refreshDetection: plainRefreshDetection
        });
        
        const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
        const baseUrl = new URL(origin).origin;
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${baseUrl}/settings?error=${encodeURIComponent('Token format error - please try reconnecting')}`,
          },
        });
      }
      
      // Store as plain text with proper flag
      encryptedAccessToken = tokens.access_token;
      encryptedRefreshToken = tokens.refresh_token || null;
      tokensEncrypted = false;
      
      console.warn('⚠️ Storing tokens as plain text due to encryption failure');
    }

    // Check if this email is already connected for this user
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
        const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
        const baseUrl = new URL(origin).origin;
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${baseUrl}/settings?error=${encodeURIComponent('Failed to update Gmail connection')}`,
          },
        });
      }
    } else {
      // Check if this is the first connection for this user
      const { count } = await supabase
        .from("email_connections")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", state);

      const isFirstConnection = !count || count === 0;

      // Insert new connection
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
        const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
        const baseUrl = new URL(origin).origin;
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${baseUrl}/settings?error=${encodeURIComponent('Failed to save Gmail connection')}`,
          },
        });
      }

      console.log(`✅ New Gmail account connected${isFirstConnection ? ' (set as primary)' : ''}`);
    }

    console.log("Gmail connection stored successfully");

    // Get the app's base URL from the referer header
    const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
    const baseUrl = new URL(origin).origin;

    // Redirect back to the app
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/settings?gmail=connected`,
      },
    });
  } catch (error: any) {
    console.error("Error in gmail-oauth-callback:", error);
    const origin = req.headers.get('referer') || 'https://launch-buddy-bot.lovable.app';
    const baseUrl = new URL(origin).origin;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/settings?error=${encodeURIComponent('Failed to connect Gmail account')}`,
      },
    });
  }
});
