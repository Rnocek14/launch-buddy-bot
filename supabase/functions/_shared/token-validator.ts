/**
 * Smart token detection and validation for Gmail/Outlook OAuth tokens
 * Detects encryption state and validates consistency
 */

export interface TokenDetectionResult {
  isEncrypted: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  issues: string[];
  recommendedAction: 'none' | 'decrypt_and_reencrypt' | 'encrypt' | 'reconnect';
}

/**
 * Detects if a token is encrypted or plain text
 * - Gmail plain tokens: start with "ya29." (access) or "1//" (refresh)
 * - Microsoft plain tokens: start with "ey" (JWT format)
 * - Encrypted tokens: base64 format with high entropy
 */
export function detectTokenEncryption(
  token: string,
  provider: 'gmail' | 'outlook'
): TokenDetectionResult {
  if (!token) {
    return { isEncrypted: false, confidence: 'high', reason: 'Empty token' };
  }

  // Gmail plain text patterns
  if (provider === 'gmail') {
    if (token.startsWith('ya29.')) {
      return { isEncrypted: false, confidence: 'high', reason: 'Gmail access token prefix (ya29.)' };
    }
    if (token.startsWith('1//')) {
      return { isEncrypted: false, confidence: 'high', reason: 'Gmail refresh token prefix (1//)' };
    }
  }

  // Microsoft/Outlook plain text pattern (JWT tokens)
  if (provider === 'outlook') {
    if (token.startsWith('ey')) {
      return { isEncrypted: false, confidence: 'high', reason: 'Microsoft JWT token (ey prefix)' };
    }
  }

  // Check for base64 pattern (encrypted tokens are base64-encoded)
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(token);
  
  if (isBase64 && token.length > 100) {
    // Calculate entropy (encrypted data has high randomness)
    const uniqueChars = new Set(token).size;
    const entropy = uniqueChars / token.length;

    if (entropy > 0.6) {
      return {
        isEncrypted: true,
        confidence: 'high',
        reason: `Base64 with high entropy (${(entropy * 100).toFixed(1)}%)`
      };
    }

    return {
      isEncrypted: true,
      confidence: 'medium',
      reason: `Base64 format but lower entropy (${(entropy * 100).toFixed(1)}%)`
    };
  }

  // Unknown format - assume encrypted for safety
  return {
    isEncrypted: true,
    confidence: 'low',
    reason: 'Unknown format, assumed encrypted'
  };
}

/**
 * Validates that stored tokens match their encryption flag in the database
 * This catches mismatches like tokens_encrypted=false when tokens are actually encrypted
 */
export function validateTokenState(connection: any): TokenValidationResult {
  const issues: string[] = [];
  
  if (!connection) {
    return {
      isValid: false,
      issues: ['No connection provided'],
      recommendedAction: 'reconnect'
    };
  }

  const accessDetection = detectTokenEncryption(
    connection.access_token,
    connection.provider
  );
  
  const refreshDetection = detectTokenEncryption(
    connection.refresh_token,
    connection.provider
  );

  // Check for mismatches between stored flag and actual token state
  if (connection.tokens_encrypted && !accessDetection.isEncrypted) {
    issues.push(
      `Access token marked encrypted but appears plain (${accessDetection.reason})`
    );
  }

  if (!connection.tokens_encrypted && accessDetection.isEncrypted) {
    issues.push(
      `Access token marked plain but appears encrypted (${accessDetection.reason})`
    );
  }

  if (connection.tokens_encrypted && !refreshDetection.isEncrypted) {
    issues.push(
      `Refresh token marked encrypted but appears plain (${refreshDetection.reason})`
    );
  }

  if (!connection.tokens_encrypted && refreshDetection.isEncrypted) {
    issues.push(
      `Refresh token marked plain but appears encrypted (${refreshDetection.reason})`
    );
  }

  const isValid = issues.length === 0;

  // Determine recommended action
  let recommendedAction: TokenValidationResult['recommendedAction'] = 'none';
  
  if (!isValid) {
    // Critical case: tokens are encrypted but flag says they're not
    if (!connection.tokens_encrypted && accessDetection.isEncrypted) {
      recommendedAction = 'decrypt_and_reencrypt';
    }
    // Tokens are plain but flag says encrypted
    else if (connection.tokens_encrypted && !accessDetection.isEncrypted) {
      recommendedAction = 'encrypt';
    }
    // Mixed or unclear state
    else {
      recommendedAction = 'reconnect';
    }
  }

  return {
    isValid,
    issues,
    recommendedAction
  };
}
