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
  
  // First try bracketed format: <https://...>, <mailto:...>
  const parts = header.split(',').map(p => p.trim());
  for (const part of parts) {
    const match = part.match(/^<(.+)>$/);
    if (match) {
      const value = match[1];
      if (value.startsWith('https://')) {
        result.url = value;
      } else if (value.startsWith('http://')) {
        if (!result.url) result.url = value;
      } else if (value.startsWith('mailto:')) {
        result.mailto = value;
      }
    }
  }

  // Fallback: scan for unbracketed URLs if nothing found
  if (!result.url) {
    const urlMatch = header.match(/https?:\/\/\S+/);
    if (urlMatch) result.url = urlMatch[0].replace(/[>,\s]+$/, '');
  }
  if (!result.mailto) {
    const mailtoMatch = header.match(/mailto:\S+/);
    if (mailtoMatch) result.mailto = mailtoMatch[0].replace(/[>,\s]+$/, '');
  }

  // Only keep https URLs
  if (result.url && !result.url.startsWith('https://')) {
    result.url = undefined;
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
    // Using gmail.metadata (sensitive scope) instead of gmail.readonly (restricted scope)
    // to avoid CASA security assessment requirement. We only read message headers
    // (From, Subject, Date, List-Unsubscribe) — never message bodies.
    const scopes = [
      'https://www.googleapis.com/auth/gmail.metadata',
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

      let errorDetail = errorText;
      try {
        const errorData = JSON.parse(errorText);
        errorDetail = errorData.error_description || errorData.error || errorText;
      } catch {
        errorDetail = errorText;
      }

      throw new Error(`Failed to refresh access token: ${errorDetail}`);
    }

    const tokens = await response.json();
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    return {
      access_token: tokens.access_token,
      refresh_token: actualRefreshToken,
      expires_at: expiresAt,
    };
  }

  async sendEmail(_accessToken: string, _email: EmailData): Promise<void> {
    // Disabled: gmail.send is a restricted scope requiring CASA assessment.
    // Footprint Finder routes all outbound deletion emails through Resend
    // with the user's email as reply-to. This method is kept to satisfy the
    // EmailProvider interface but should never be called.
    throw new Error('Gmail sending is disabled. Outbound emails are sent via Resend.');
  }

  async getMessages(accessToken: string, filters?: ScanFilters): Promise<EmailMessage[]> {
    const targetCount = filters?.maxResults || 100;
    console.log(`Gmail: Fetching up to ${targetCount} messages`);

    // Gmail caps maxResults per request at 500 — paginate via pageToken for larger scans.
    const PAGE_SIZE = Math.min(500, targetCount);
    const messageIds: string[] = [];
    let pageToken: string | undefined;

    while (messageIds.length < targetCount) {
      const remaining = targetCount - messageIds.length;
      const params = new URLSearchParams({
        maxResults: Math.min(PAGE_SIZE, remaining).toString(),
      });
      if (pageToken) params.set('pageToken', pageToken);

      if (filters?.after) {
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
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Gmail fetch messages error:', error);
        throw new Error('Failed to fetch Gmail messages');
      }

      const data = await response.json();
      if (!data.messages || data.messages.length === 0) break;

      for (const m of data.messages) messageIds.push(m.id);
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    console.log(`Gmail: Got ${messageIds.length} message IDs, fetching metadata in parallel`);

    // Fetch metadata in parallel batches. Larger batches finish faster, which
    // matters for staying under edge-function CPU/memory limits on big scans.
    const metadataHeaders = ['From', 'Subject', 'Date', 'List-Unsubscribe', 'List-Unsubscribe-Post'];
    const BATCH = 50;
    const messages: EmailMessage[] = [];

    async function fetchOne(id: string): Promise<EmailMessage | null> {
      const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
      detailUrl.searchParams.set('format', 'metadata');
      for (const h of metadataHeaders) detailUrl.searchParams.append('metadataHeaders', h);

      try {
        const r = await fetch(detailUrl.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) return null;
        const detail = await r.json();
        const headers = detail.payload?.headers || [];
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        const listUnsub = headers.find((h: any) => h.name.toLowerCase() === 'list-unsubscribe')?.value || '';
        const listUnsubPost = headers.find((h: any) => h.name.toLowerCase() === 'list-unsubscribe-post')?.value || '';
        const { url: unsubscribeUrl, mailto: unsubscribeMailto } = parseListUnsubscribe(listUnsub);
        const hasOneClick = listUnsubPost.toLowerCase().includes('list-unsubscribe=one-click');
        return {
          id,
          from,
          subject,
          date,
          snippet: undefined,
          unsubscribeUrl,
          unsubscribeMailto,
          hasOneClick: hasOneClick || undefined,
        };
      } catch (_e) {
        return null;
      }
    }

    for (let i = 0; i < messageIds.length; i += BATCH) {
      const slice = messageIds.slice(i, i + BATCH);
      const results = await Promise.all(slice.map(fetchOne));
      for (const m of results) if (m) messages.push(m);
    }

    console.log(`Gmail: Fetched ${messages.length} messages`);
    return messages;
  }
}
