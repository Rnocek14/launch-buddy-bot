// Gmail provider implementation
import { EmailProvider, TokenData, ConnectionData, EmailMessage, ScanFilters, EmailData } from './types.ts';
import { encrypt, decrypt } from '../encryption.ts';

/**
 * Parse List-Unsubscribe header value into URL and mailto components.
 * Format: `<https://example.com/unsub>, <mailto:unsub@example.com>`
 */
function parseListUnsubscribe(header: string): { url?: string; mailto?: string } {
  const result: { url?: string; mailto?: string } = {};
  if (!header) return result;
  
  const parts = header.split(',').map(p => p.trim());
  for (const part of parts) {
    const match = part.match(/^<(.+)>$/);
    if (!match) continue;
    const value = match[1];
    if (value.startsWith('https://')) {
      result.url = value;
    } else if (value.startsWith('http://')) {
      // Only use http as fallback if no https found
      if (!result.url) result.url = value;
    } else if (value.startsWith('mailto:')) {
      result.mailto = value;
    }
  }
  return result;
}

export class GmailProvider implements EmailProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') || '';
    this.clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || '';
    this.redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-oauth-callback`;
  }

  getOAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: userId,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, userId: string): Promise<ConnectionData> {
    console.log('Gmail: Exchanging code for tokens');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Gmail token exchange error:', error);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();
    console.log('Gmail: Got user email:', profile.email);

    // Encrypt tokens
    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = await encrypt(tokens.refresh_token);

    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Convert base64 encrypted strings to Uint8Array for database storage
    const accessTokenBytes = Uint8Array.from(atob(encryptedAccessToken), c => c.charCodeAt(0));
    const refreshTokenBytes = Uint8Array.from(atob(encryptedRefreshToken), c => c.charCodeAt(0));

    return {
      email: profile.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      provider_user_id: profile.id,
      tokens_encrypted: true,
      access_token_encrypted: accessTokenBytes,
      refresh_token_encrypted: refreshTokenBytes,
    };
  }

  async refreshToken(refreshToken: string, userId: string, isEncrypted: boolean): Promise<TokenData> {
    console.log('Gmail: Refreshing access token');
    
    let actualRefreshToken = refreshToken;
    if (isEncrypted) {
      actualRefreshToken = await decrypt(refreshToken);
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: actualRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail token refresh error:', errorText);
      
      // Try to parse the error to get detailed message
      try {
        const errorData = JSON.parse(errorText);
        const errorDetail = errorData.error_description || errorData.error || 'Unknown error';
        throw new Error(`Failed to refresh access token: ${errorDetail}`);
      } catch (e) {
        // If parsing fails, throw with the raw error text
        throw new Error(`Failed to refresh access token: ${errorText}`);
      }
    }

    const tokens = await response.json();
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    return {
      access_token: tokens.access_token,
      refresh_token: actualRefreshToken,
      expires_at: expiresAt,
    };
  }

  async sendEmail(accessToken: string, email: EmailData): Promise<void> {
    console.log('Gmail: Sending email to', email.to);

    const message = [
      `To: ${email.to}`,
      `Subject: ${email.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      email.body,
    ].join('\r\n');

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gmail send error:', error);
      throw new Error('Failed to send email via Gmail');
    }

    console.log('Gmail: Email sent successfully');
  }

  async getMessages(accessToken: string, filters?: ScanFilters): Promise<EmailMessage[]> {
    console.log('Gmail: Fetching messages');

    const params = new URLSearchParams({
      maxResults: (filters?.maxResults || 100).toString(),
    });

    if (filters?.after) {
      // Convert ISO timestamp to Gmail's YYYY/MM/DD format
      const date = new Date(filters.after);
      const gmailDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      params.append('q', `after:${gmailDate}`);
    }

    if (filters?.query) {
      const existingQ = params.get('q');
      params.set('q', existingQ ? `${existingQ} ${filters.query}` : filters.query);
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gmail fetch messages error:', error);
      throw new Error('Failed to fetch Gmail messages');
    }

    const data = await response.json();
    const messages: EmailMessage[] = [];

    if (data.messages) {
      for (const msg of data.messages.slice(0, filters?.maxResults || 100)) {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          const headers = detail.payload?.headers || [];
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          // Extract List-Unsubscribe headers for subscription detection
          const listUnsub = headers.find((h: any) => h.name.toLowerCase() === 'list-unsubscribe')?.value || '';
          const listUnsubPost = headers.find((h: any) => h.name.toLowerCase() === 'list-unsubscribe-post')?.value || '';
          
          const { url: unsubscribeUrl, mailto: unsubscribeMailto } = parseListUnsubscribe(listUnsub);
          const hasOneClick = listUnsubPost.toLowerCase().includes('list-unsubscribe=one-click');

          messages.push({
            id: msg.id,
            from,
            subject,
            date,
            snippet: detail.snippet,
            unsubscribeUrl,
            unsubscribeMailto,
            hasOneClick: hasOneClick || undefined,
          });
        }
      }
    }

    console.log(`Gmail: Fetched ${messages.length} messages`);
    return messages;
  }
}
