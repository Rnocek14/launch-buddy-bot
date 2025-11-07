// Error code mapping for privacy contact discovery
// Maps internal errors to user-actionable hints

export type ErrorCode = 
  | 'no_policy_found'
  | 'fetch_failed'
  | 'timeout'
  | 'bot_protection'
  | 'invalid_content'
  | 'dns_error'
  | 'ssl_error'
  | 'redirect_loop';

export type ErrorAction = {
  code: ErrorCode;
  userMessage: string;
  hint: string;
  retryable: boolean;
  escalate: boolean;
};

export const ERROR_ACTIONS: Record<ErrorCode, ErrorAction> = {
  no_policy_found: {
    code: 'no_policy_found',
    userMessage: 'Could not locate a privacy policy page',
    hint: 'Try Phase 1.2 probes (security.txt, sitemap) or manual verification',
    retryable: false,
    escalate: false
  },
  fetch_failed: {
    code: 'fetch_failed',
    userMessage: 'Failed to fetch the page',
    hint: 'Retry with exponential backoff',
    retryable: true,
    escalate: false
  },
  timeout: {
    code: 'timeout',
    userMessage: 'Request timed out',
    hint: 'Retry with exponential backoff',
    retryable: true,
    escalate: false
  },
  bot_protection: {
    code: 'bot_protection',
    userMessage: 'Bot protection detected',
    hint: 'Escalate to Tier 2 (browserless with stealth)',
    retryable: false,
    escalate: true
  },
  invalid_content: {
    code: 'invalid_content',
    userMessage: 'Page content could not be parsed',
    hint: 'Manual verification required',
    retryable: false,
    escalate: false
  },
  dns_error: {
    code: 'dns_error',
    userMessage: 'Domain name resolution failed',
    hint: 'Check domain validity or retry',
    retryable: true,
    escalate: false
  },
  ssl_error: {
    code: 'ssl_error',
    userMessage: 'SSL/TLS certificate error',
    hint: 'Domain may have certificate issues',
    retryable: false,
    escalate: false
  },
  redirect_loop: {
    code: 'redirect_loop',
    userMessage: 'Too many redirects detected',
    hint: 'Domain configuration issue - manual review needed',
    retryable: false,
    escalate: false
  }
};

export function getErrorAction(code: ErrorCode): ErrorAction {
  return ERROR_ACTIONS[code];
}

export function classifyError(error: Error | string): ErrorCode {
  const msg = typeof error === 'string' ? error : error.message.toLowerCase();
  
  if (msg.includes('timeout') || msg.includes('aborted')) return 'timeout';
  if (msg.includes('dns') || msg.includes('enotfound')) return 'dns_error';
  if (msg.includes('ssl') || msg.includes('certificate')) return 'ssl_error';
  if (msg.includes('redirect') || msg.includes('310')) return 'redirect_loop';
  if (msg.includes('captcha') || msg.includes('cloudflare')) return 'bot_protection';
  if (msg.includes('parse') || msg.includes('invalid')) return 'invalid_content';
  
  return 'fetch_failed';
}
