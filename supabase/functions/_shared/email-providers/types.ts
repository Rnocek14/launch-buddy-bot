// Email provider abstraction layer types

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO timestamp
  email?: string;
  provider_user_id?: string;
}

export interface ConnectionData {
  email: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  provider_user_id?: string;
  tokens_encrypted?: boolean;
  access_token_encrypted?: Uint8Array;
  refresh_token_encrypted?: Uint8Array;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet?: string;
  body?: string;
}

export interface ScanFilters {
  maxResults?: number;
  after?: string; // Date filter
  query?: string; // Search query
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface EmailProvider {
  /**
   * Generate OAuth URL for user authorization
   */
  getOAuthUrl(userId: string): string;

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  handleCallback(code: string, userId: string): Promise<ConnectionData>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refreshToken: string, userId: string, isEncrypted: boolean): Promise<TokenData>;

  /**
   * Send email using provider's API
   */
  sendEmail(accessToken: string, email: EmailData): Promise<void>;

  /**
   * Get messages from user's inbox
   */
  getMessages(accessToken: string, filters?: ScanFilters): Promise<EmailMessage[]>;
}

export type ProviderType = 'gmail' | 'outlook';
