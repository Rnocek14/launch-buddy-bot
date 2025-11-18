import { encrypt } from './encryption.ts';

/**
 * Re-encrypts tokens if they're marked as encrypted but appear to be plain text
 * This handles migration from plain text to encrypted tokens
 */
export async function reencryptTokensIfNeeded(
  connection: any,
  supabase: any
): Promise<void> {
  // If tokens are marked as encrypted but access_token looks like plain text
  // Google tokens start with "ya29.", Microsoft tokens start with "ey"
  const looksLikePlainText = connection.access_token?.startsWith('ya29.') || 
                             connection.access_token?.startsWith('ey');
  
  if (connection.tokens_encrypted && looksLikePlainText) {
    console.log('Detected plain text token marked as encrypted, re-encrypting...', {
      connectionId: connection.id,
      email: connection.email
    });
    
    try {
      const encryptedAccessToken = await encrypt(connection.access_token);
      const encryptedRefreshToken = connection.refresh_token 
        ? await encrypt(connection.refresh_token)
        : null;
      
      await supabase
        .from('email_connections')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          tokens_encrypted: true,
        })
        .eq('id', connection.id);
        
      console.log('Tokens re-encrypted successfully');
    } catch (error) {
      console.error('Re-encryption failed:', error);
      // Mark as not encrypted if re-encryption fails
      await supabase
        .from('email_connections')
        .update({ tokens_encrypted: false })
        .eq('id', connection.id);
    }
  }
}
