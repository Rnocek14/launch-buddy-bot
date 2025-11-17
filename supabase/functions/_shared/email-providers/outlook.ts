// Outlook/Microsoft 365 provider implementation
import { EmailProvider, TokenData, ConnectionData, EmailMessage, ScanFilters, EmailData } from './types.ts';
import { encrypt, decrypt } from '../encryption.ts';

export class OutlookProvider implements EmailProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID') || '';
    this.clientSecret = Deno.env.get('MICROSOFT_OAUTH_CLIENT_SECRET') || '';
    this.redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/outlook-oauth-callback`;
  }

  getOAuthUrl(userId: string): string {
    const scopes = [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read',
      'offline_access'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state: userId,
      prompt: 'select_account',
    });

    return `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, userId: string): Promise<ConnectionData> {
    console.log('Outlook: Exchanging code for tokens');
    
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Outlook token exchange error:', error);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    
    // Get user profile from Microsoft Graph
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      console.error('Outlook profile fetch error:', error);
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();
    console.log('Outlook: Got user email:', profile.mail || profile.userPrincipalName);

    // Encrypt tokens
    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = await encrypt(tokens.refresh_token);

    // Microsoft tokens typically expire in 1 hour (3600 seconds)
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    // Convert base64 encrypted strings to Uint8Array for database storage
    const accessTokenBytes = Uint8Array.from(atob(encryptedAccessToken), c => c.charCodeAt(0));
    const refreshTokenBytes = Uint8Array.from(atob(encryptedRefreshToken), c => c.charCodeAt(0));

    return {
      email: profile.mail || profile.userPrincipalName,
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
    console.log('Outlook: Refreshing access token');
    
    let actualRefreshToken = refreshToken;
    if (isEncrypted) {
      actualRefreshToken = await decrypt(refreshToken);
    }

    const response = await fetch(
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: actualRefreshToken,
          grant_type: 'refresh_token',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Outlook token refresh error:', error);
      throw new Error('Failed to refresh access token');
    }

    const tokens = await response.json();
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || actualRefreshToken, // Microsoft may not return new refresh token
      expires_at: expiresAt,
    };
  }

  async sendEmail(accessToken: string, email: EmailData): Promise<void> {
    console.log('Outlook: Sending email to', email.to);

    const message = {
      message: {
        subject: email.subject,
        body: {
          contentType: 'HTML',
          content: email.body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email.to,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Outlook send error:', error);
      throw new Error('Failed to send email via Outlook');
    }

    console.log('Outlook: Email sent successfully');
  }

  async getMessages(accessToken: string, filters?: ScanFilters): Promise<EmailMessage[]> {
    console.log('Outlook: Fetching messages');

    // Build OData query
    let url = 'https://graph.microsoft.com/v1.0/me/messages';
    const params = new URLSearchParams({
      $top: (filters?.maxResults || 100).toString(),
      $select: 'id,from,subject,receivedDateTime,bodyPreview',
      $orderby: 'receivedDateTime DESC',
    });

    if (filters?.after) {
      params.append('$filter', `receivedDateTime ge ${filters.after}`);
    }

    if (filters?.query) {
      params.append('$search', `"${filters.query}"`);
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Outlook fetch messages error:', error);
      throw new Error('Failed to fetch Outlook messages');
    }

    const data = await response.json();
    const messages: EmailMessage[] = [];

    if (data.value) {
      for (const msg of data.value) {
        messages.push({
          id: msg.id,
          from: msg.from?.emailAddress?.address || '',
          subject: msg.subject || '',
          date: msg.receivedDateTime || '',
          snippet: msg.bodyPreview || '',
        });
      }
    }

    console.log(`Outlook: Fetched ${messages.length} messages`);
    return messages;
  }
}
