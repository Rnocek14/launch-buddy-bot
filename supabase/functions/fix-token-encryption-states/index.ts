import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { detectTokenEncryption, validateTokenState } from "../_shared/token-validator.ts";
import { encrypt, decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Use service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user is admin (optional - add your own auth check)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('🔍 Starting token encryption state migration...');

    // Get all email connections
    const { data: connections, error: connectionsError } = await supabase
      .from('email_connections')
      .select('*');

    if (connectionsError) {
      throw connectionsError;
    }

    const results = {
      total: connections?.length || 0,
      valid: 0,
      fixed: 0,
      needsReconnect: 0,
      skipped: 0,
      errors: [] as any[]
    };

    console.log(`Found ${results.total} email connections to check`);

    for (const connection of connections || []) {
      const validation = validateTokenState(connection);

      if (validation.isValid) {
        results.valid++;
        console.log(`✅ Connection ${connection.id} (${connection.email}) is valid`);
        continue;
      }

      console.log(`⚠️ Processing connection ${connection.id} (${connection.email}):`, validation.issues);

      try {
        if (validation.recommendedAction === 'decrypt_and_reencrypt') {
          // Case: Tokens are encrypted but flag says they're not
          console.log(`🔧 Repairing mislabeled encrypted tokens for ${connection.email}`);

          const decryptedAccess = await decrypt(connection.access_token);
          const decryptedRefresh = await decrypt(connection.refresh_token);

          console.log('✅ Successfully decrypted tokens');

          // Re-encrypt properly
          const reencryptedAccess = await encrypt(decryptedAccess);
          const reencryptedRefresh = await encrypt(decryptedRefresh);

          // Validate the re-encryption worked
          const accessCheck = detectTokenEncryption(reencryptedAccess, connection.provider);
          const refreshCheck = detectTokenEncryption(reencryptedRefresh, connection.provider);

          if (!accessCheck.isEncrypted || !refreshCheck.isEncrypted) {
            throw new Error('Re-encryption validation failed');
          }

          // Update with correct flag
          const { error: updateError } = await supabase
            .from('email_connections')
            .update({
              access_token: reencryptedAccess,
              refresh_token: reencryptedRefresh,
              tokens_encrypted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', connection.id);

          if (updateError) {
            throw updateError;
          }

          results.fixed++;
          console.log(`✅ Fixed connection ${connection.id} (${connection.email})`);

        } else if (validation.recommendedAction === 'encrypt') {
          // Case: Plain tokens that should be encrypted
          console.log(`🔐 Encrypting plain tokens for ${connection.email}`);

          const encryptedAccess = await encrypt(connection.access_token);
          const encryptedRefresh = await encrypt(connection.refresh_token);

          // Validate encryption
          const accessCheck = detectTokenEncryption(encryptedAccess, connection.provider);
          const refreshCheck = detectTokenEncryption(encryptedRefresh, connection.provider);

          if (!accessCheck.isEncrypted || !refreshCheck.isEncrypted) {
            throw new Error('Encryption validation failed');
          }

          const { error: updateError } = await supabase
            .from('email_connections')
            .update({
              access_token: encryptedAccess,
              refresh_token: encryptedRefresh,
              tokens_encrypted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', connection.id);

          if (updateError) {
            throw updateError;
          }

          results.fixed++;
          console.log(`✅ Encrypted connection ${connection.id} (${connection.email})`);

        } else if (validation.recommendedAction === 'reconnect') {
          // Case: Tokens are corrupted beyond repair
          results.needsReconnect++;
          console.log(`⚠️ Connection ${connection.id} (${connection.email}) needs manual reconnection`);

        } else {
          results.skipped++;
          console.log(`⏭️ Skipped connection ${connection.id} (${connection.email})`);
        }

      } catch (fixError: any) {
        results.errors.push({
          connectionId: connection.id,
          email: connection.email,
          error: fixError.message,
          stack: fixError.stack
        });
        console.error(`❌ Failed to fix connection ${connection.id} (${connection.email}):`, fixError);
      }
    }

    console.log('✅ Migration complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Migration complete: ${results.fixed} fixed, ${results.valid} already valid, ${results.needsReconnect} need reconnection`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Migration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
