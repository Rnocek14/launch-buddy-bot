import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Check if user has Pro subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.tier !== 'pro') {
      return new Response(
        JSON.stringify({ error: 'Pro subscription required for broker scanning' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Start a new scan
      const body = await req.json().catch(() => ({}));
      
      // Check if user already has a scan in progress
      const { data: existingScan } = await supabase
        .from('broker_scans')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'running'])
        .single();

      if (existingScan) {
        return new Response(
          JSON.stringify({ 
            error: 'A scan is already in progress',
            scan_id: existingScan.id,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check cooldown (1 scan per 24 hours)
      const { data: recentScan } = await supabase
        .from('broker_scans')
        .select('id, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (recentScan) {
        return new Response(
          JSON.stringify({ 
            error: 'Please wait 24 hours between scans',
            last_scan: recentScan.completed_at,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get broker count
      const { count: brokerCount } = await supabase
        .from('data_brokers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Create new scan
      const { data: newScan, error: scanError } = await supabase
        .from('broker_scans')
        .insert({
          user_id: userId,
          status: 'pending',
          total_brokers: brokerCount || 0,
        })
        .select()
        .single();

      if (scanError) {
        console.error('Error creating scan:', scanError);
        return new Response(
          JSON.stringify({ error: 'Failed to create scan' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Created broker scan ${newScan.id} for user ${userId}`);

      return new Response(
        JSON.stringify({ 
          message: 'Scan started',
          scan: newScan,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get scan status and results
      const url = new URL(req.url);
      const scanId = url.searchParams.get('scan_id');

      // Get the latest scan or specific scan
      let scanQuery = supabase
        .from('broker_scans')
        .select('*')
        .eq('user_id', userId);

      if (scanId) {
        scanQuery = scanQuery.eq('id', scanId);
      } else {
        scanQuery = scanQuery.order('created_at', { ascending: false }).limit(1);
      }

      const { data: scan } = await scanQuery.single();

      if (!scan) {
        return new Response(
          JSON.stringify({ scan: null, results: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get results for this user
      const { data: results } = await supabase
        .from('broker_scan_results')
        .select(`
          id,
          status,
          profile_url,
          match_confidence,
          scanned_at,
          opted_out_at,
          broker:data_brokers(
            id,
            name,
            slug,
            website,
            opt_out_url,
            opt_out_difficulty,
            opt_out_time_estimate,
            instructions,
            requires_captcha,
            requires_phone,
            requires_id
          )
        `)
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });

      // Get all brokers for reference
      const { data: brokers } = await supabase
        .from('data_brokers')
        .select('id, name, slug, priority, opt_out_difficulty')
        .eq('is_active', true)
        .order('priority');

      return new Response(
        JSON.stringify({ 
          scan,
          results: results || [],
          brokers: brokers || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
