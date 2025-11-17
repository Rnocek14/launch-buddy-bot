import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_OAUTH_CLIENT_SECRET');
    const redirectUri = 'https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/outlook-oauth-callback';

    const testState = 'test-user-id-12345';
    const scope = 'openid email profile offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read';
    
    const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(clientId || '')}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(testState)}`;

    return new Response(
      JSON.stringify({
        config: {
          clientId: clientId || 'NOT_SET',
          clientSecretSet: !!clientSecret,
          clientSecretLength: clientSecret?.length || 0,
          redirectUri,
          scope,
        },
        generatedUrl: oauthUrl,
        note: 'This is for debugging only. The OAuth URL above is what gets sent to Microsoft.'
      }, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
