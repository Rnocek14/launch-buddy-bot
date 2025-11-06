/**
 * Helper functions for Google OAuth token management
 */

export interface GoogleTokenInfo {
  scope: string;
  expires_in: number;
  access_type: string;
}

/**
 * Validates if a Google access token has the required Gmail scope
 */
export async function validateGmailScope(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    
    if (!response.ok) {
      console.error('Token validation failed:', response.status);
      return false;
    }
    
    const tokenInfo: GoogleTokenInfo = await response.json();
    const scopes = tokenInfo.scope.split(' ');
    
    // Check if Gmail readonly scope is present
    return scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

/**
 * Checks if the token is expired or about to expire (within 5 minutes)
 */
export async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    
    if (!response.ok) {
      return false;
    }
    
    const tokenInfo: GoogleTokenInfo = await response.json();
    // Token is valid if it expires in more than 5 minutes
    return tokenInfo.expires_in > 300;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}
