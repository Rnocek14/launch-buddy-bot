import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

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

    // Check if tokens are properly encrypted
    const { data: connections, error: connectionsError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id);

    if (connectionsError) throw connectionsError;

    const health = connections?.map(conn => {
      // Google tokens start with "ya29.", Microsoft tokens start with "ey"
      const accessTokenLooksPlain = conn.access_token?.startsWith('ya29.') || 
                                     conn.access_token?.startsWith('ey');
      const refreshTokenLooksPlain = conn.refresh_token?.startsWith('1//') || 
                                      conn.refresh_token?.startsWith('0.');
      
      return {
        id: conn.id,
        email: conn.email,
        provider: conn.provider,
        tokens_encrypted: conn.tokens_encrypted,
        access_token_looks_plain: accessTokenLooksPlain,
        refresh_token_looks_plain: refreshTokenLooksPlain,
        needs_reencryption: conn.tokens_encrypted && (accessTokenLooksPlain || refreshTokenLooksPlain),
        status: conn.tokens_encrypted && (accessTokenLooksPlain || refreshTokenLooksPlain)
          ? '⚠️ Needs Re-encryption'
          : conn.tokens_encrypted
          ? '✅ Properly Encrypted'
          : '🔓 Not Encrypted',
      };
    }) || [];

    return new Response(
      JSON.stringify({
        user_id: user.id,
        connections: health,
        summary: {
          total: health.length,
          encrypted: health.filter(h => h.status === '✅ Properly Encrypted').length,
          needs_reencryption: health.filter(h => h.needs_reencryption).length,
          unencrypted: health.filter(h => h.status === '🔓 Not Encrypted').length,
        },
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking token health:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
