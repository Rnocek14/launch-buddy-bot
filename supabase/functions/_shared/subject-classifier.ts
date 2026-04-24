/**
 * Subject line classifier — pure regex pattern matching.
 * No AI calls. Zero cost. Deterministic.
 *
 * Detects intent signals from email subject lines under the gmail.metadata scope.
 * Used to enrich service discovery with confidence scoring and activity status.
 */

export type SignalType =
  | 'signup'        // Welcome, verify email, account created
  | 'transaction'   // Receipt, invoice, order, payment, renewal
  | 'security'      // Password reset, login alert, security notice
  | 'newsletter'   // Marketing, digest, weekly update
  | 'policy'        // Terms update, privacy policy change
  | 'shipping'      // Shipped, delivered, tracking
  | 'social'        // Mentions, comments, friend requests
  | 'unknown';

export interface ClassificationResult {
  signal: SignalType;
  confidence: number; // 0-1 — how confident the regex match is
  matchedPattern?: string;
}

// Order matters: more specific patterns first
const PATTERNS: Array<{ signal: SignalType; regex: RegExp; confidence: number; label: string }> = [
  // === SIGNUP / VERIFICATION (highest value — proves account exists) ===
  { signal: 'signup', regex: /\b(welcome\s+to|welcome\s+aboard)\b/i, confidence: 0.95, label: 'welcome' },
  { signal: 'signup', regex: /\b(verify|confirm)\s+(your\s+)?(email|account|address)/i, confidence: 0.95, label: 'verify' },
  { signal: 'signup', regex: /\b(activate|complete)\s+(your\s+)?(account|registration|signup)/i, confidence: 0.9, label: 'activate' },
  { signal: 'signup', regex: /\b(account\s+(created|registered)|new\s+account)\b/i, confidence: 0.9, label: 'created' },
  { signal: 'signup', regex: /\b(thanks?\s+for\s+(signing\s+up|joining|registering))\b/i, confidence: 0.9, label: 'thanks-signup' },
  { signal: 'signup', regex: /\bgetting\s+started\b/i, confidence: 0.7, label: 'getting-started' },

  // === TRANSACTION (proves active paid relationship) ===
  { signal: 'transaction', regex: /\b(receipt|invoice)\s*(for|#|:|from)?/i, confidence: 0.95, label: 'receipt' },
  { signal: 'transaction', regex: /\border\s+(#|number|confirmation|placed|received)/i, confidence: 0.95, label: 'order' },
  { signal: 'transaction', regex: /\b(payment\s+(received|confirmed|successful|processed))\b/i, confidence: 0.95, label: 'payment' },
  { signal: 'transaction', regex: /\b(your\s+)?(subscription\s+(renewed|will\s+renew|renewal))\b/i, confidence: 0.95, label: 'renewal' },
  { signal: 'transaction', regex: /\b(charged|billed)\s+\$?\d/i, confidence: 0.9, label: 'charged' },
  { signal: 'transaction', regex: /\b(thank\s+you\s+for\s+your\s+(order|purchase|payment))\b/i, confidence: 0.9, label: 'thanks-purchase' },
  { signal: 'transaction', regex: /\$\d+\.\d{2}/, confidence: 0.6, label: 'price' },

  // === SECURITY (proves recent active use) ===
  { signal: 'security', regex: /\b(password\s+(reset|changed|recovery))\b/i, confidence: 0.95, label: 'password' },
  { signal: 'security', regex: /\b(security\s+(alert|notice|notification))\b/i, confidence: 0.95, label: 'security-alert' },
  { signal: 'security', regex: /\b(new\s+(sign[- ]?in|login|device))\b/i, confidence: 0.95, label: 'new-login' },
  { signal: 'security', regex: /\b(suspicious\s+(activity|sign[- ]?in|login))\b/i, confidence: 0.95, label: 'suspicious' },
  { signal: 'security', regex: /\b(2fa|two[- ]factor|verification\s+code)\b/i, confidence: 0.9, label: '2fa' },
  { signal: 'security', regex: /\b(your\s+)?(login|sign[- ]?in)\s+from\b/i, confidence: 0.85, label: 'login-from' },

  // === SHIPPING (active commerce relationship) ===
  { signal: 'shipping', regex: /\b(shipped|on\s+its\s+way|out\s+for\s+delivery)\b/i, confidence: 0.95, label: 'shipped' },
  { signal: 'shipping', regex: /\b(delivered|delivery\s+confirmation)\b/i, confidence: 0.9, label: 'delivered' },
  { signal: 'shipping', regex: /\btracking\s+(number|info)/i, confidence: 0.9, label: 'tracking' },

  // === POLICY (dormant but live) ===
  { signal: 'policy', regex: /\b(privacy\s+policy|terms\s+(of\s+service|and\s+conditions))\s+(update|change|revis)/i, confidence: 0.95, label: 'policy-update' },
  { signal: 'policy', regex: /\b(we'?re\s+updating|important\s+update)\b/i, confidence: 0.6, label: 'important-update' },

  // === SOCIAL ===
  { signal: 'social', regex: /\b(mentioned\s+you|tagged\s+you|commented\s+on|liked\s+your)\b/i, confidence: 0.9, label: 'social-action' },
  { signal: 'social', regex: /\b(friend\s+request|connection\s+request|wants\s+to\s+connect)\b/i, confidence: 0.9, label: 'connection' },
  { signal: 'social', regex: /\b(new\s+(message|follower))\b/i, confidence: 0.85, label: 'new-social' },

  // === NEWSLETTER (lowest priority — usually noise) ===
  { signal: 'newsletter', regex: /\b(weekly|monthly|daily)\s+(digest|newsletter|roundup|update|recap)\b/i, confidence: 0.9, label: 'digest' },
  { signal: 'newsletter', regex: /\b(this\s+week\s+(in|at)|what'?s\s+new)\b/i, confidence: 0.7, label: 'whats-new' },
  { signal: 'newsletter', regex: /\b(\d+%\s+off|sale|deal|discount|exclusive\s+offer)\b/i, confidence: 0.85, label: 'promo' },
  { signal: 'newsletter', regex: /\b(don'?t\s+miss|last\s+chance|limited\s+time)\b/i, confidence: 0.8, label: 'urgency-marketing' },
];

export function classifySubject(subject: string | null | undefined): ClassificationResult {
  if (!subject || subject.trim().length === 0) {
    return { signal: 'unknown', confidence: 0 };
  }

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(subject)) {
      return {
        signal: pattern.signal,
        confidence: pattern.confidence,
        matchedPattern: pattern.label,
      };
    }
  }

  return { signal: 'unknown', confidence: 0 };
}

// === PER-SERVICE AGGREGATION ===

export interface ServiceSignals {
  // Counts per signal type
  signup_count: number;
  transaction_count: number;
  security_count: number;
  newsletter_count: number;
  policy_count: number;
  shipping_count: number;
  social_count: number;
  unknown_count: number;
  total: number;

  // Most recent dates per signal (ISO strings)
  last_signup_at?: string;
  last_transaction_at?: string;
  last_security_at?: string;
  last_activity_at?: string; // any non-newsletter, non-policy signal

  // Sample subjects (truncated, for transparency)
  signup_sample?: string;
  transaction_sample?: string;
  security_sample?: string;
}

export interface ServiceProfile {
  signals: ServiceSignals;
  confidence: number;       // 0-100, evidence strength that account exists
  activity_status: 'active_paid' | 'active_free' | 'dormant' | 'newsletter_only' | 'unknown';
  cleanup_priority: number; // 0-100, higher = clean up first
  reasons: string[];        // human-readable explanations
}

export function emptySignals(): ServiceSignals {
  return {
    signup_count: 0,
    transaction_count: 0,
    security_count: 0,
    newsletter_count: 0,
    policy_count: 0,
    shipping_count: 0,
    social_count: 0,
    unknown_count: 0,
    total: 0,
  };
}

export function addSignal(
  signals: ServiceSignals,
  classification: ClassificationResult,
  date: string,
  subject: string,
): ServiceSignals {
  signals.total++;
  const safeSubject = subject.substring(0, 200);
  const updateLastActivity = !['newsletter', 'policy', 'unknown'].includes(classification.signal);

  switch (classification.signal) {
    case 'signup':
      signals.signup_count++;
      if (!signals.last_signup_at || date > signals.last_signup_at) {
        signals.last_signup_at = date;
        signals.signup_sample = safeSubject;
      }
      break;
    case 'transaction':
      signals.transaction_count++;
      if (!signals.last_transaction_at || date > signals.last_transaction_at) {
        signals.last_transaction_at = date;
        signals.transaction_sample = safeSubject;
      }
      break;
    case 'security':
      signals.security_count++;
      if (!signals.last_security_at || date > signals.last_security_at) {
        signals.last_security_at = date;
        signals.security_sample = safeSubject;
      }
      break;
    case 'shipping':
      signals.shipping_count++;
      break;
    case 'social':
      signals.social_count++;
      break;
    case 'newsletter':
      signals.newsletter_count++;
      break;
    case 'policy':
      signals.policy_count++;
      break;
    default:
      signals.unknown_count++;
  }

  if (updateLastActivity && (!signals.last_activity_at || date > signals.last_activity_at)) {
    signals.last_activity_at = date;
  }

  return signals;
}

/**
 * Compute a service profile from aggregated signals.
 *
 * Confidence (0-100): how sure we are the account exists.
 *   +50 signup, +40 transaction, +30 security, +20 shipping, +10 newsletter, +5 policy, +5 unknown
 *
 * Activity status:
 *   - active_paid:    transaction in last 60d
 *   - active_free:    security/login in last 90d (no recent transactions)
 *   - newsletter_only: only newsletter/policy signals
 *   - dormant:        last activity > 180d ago
 *   - unknown:        no signals or only unknown
 *
 * Cleanup priority (0-100): higher = act on this first.
 *   active_paid (recurring charges)        => 80-100
 *   active_free with security signals      => 50-70
 *   dormant with signup proof              => 30-50
 *   newsletter_only                        => 10-30
 *   unknown                                => 0-10
 */
export function computeProfile(signals: ServiceSignals): ServiceProfile {
  const reasons: string[] = [];
  const now = Date.now();
  const daysSince = (iso?: string) =>
    iso ? Math.floor((now - new Date(iso).getTime()) / 86400000) : Infinity;

  // === Confidence ===
  let confidence = 0;
  if (signals.signup_count > 0) {
    confidence += 50;
    reasons.push('Confirmed signup');
  }
  if (signals.transaction_count > 0) {
    confidence += 40;
    reasons.push(`${signals.transaction_count} transaction email${signals.transaction_count > 1 ? 's' : ''}`);
  }
  if (signals.security_count > 0) {
    confidence += 30;
    reasons.push('Security/login activity');
  }
  if (signals.shipping_count > 0) confidence += 20;
  if (signals.newsletter_count > 0) confidence += 10;
  if (signals.policy_count > 0) confidence += 5;
  if (signals.unknown_count > 0) confidence += Math.min(15, signals.unknown_count * 3);
  confidence = Math.min(100, confidence);

  // === Activity status ===
  const daysSinceTxn = daysSince(signals.last_transaction_at);
  const daysSinceSecurity = daysSince(signals.last_security_at);
  const daysSinceActivity = daysSince(signals.last_activity_at);

  let status: ServiceProfile['activity_status'] = 'unknown';
  if (daysSinceTxn <= 60) {
    status = 'active_paid';
    reasons.push(`Recent transaction (${daysSinceTxn}d ago)`);
  } else if (daysSinceSecurity <= 90) {
    status = 'active_free';
    reasons.push(`Recently used (${daysSinceSecurity}d ago)`);
  } else if (signals.total > 0 && signals.signup_count === 0 && signals.transaction_count === 0 && signals.security_count === 0) {
    if (signals.newsletter_count > 0 || signals.policy_count > 0) {
      status = 'newsletter_only';
      reasons.push('Only marketing/policy emails');
    }
  } else if (daysSinceActivity > 180 && signals.signup_count + signals.transaction_count + signals.security_count > 0) {
    status = 'dormant';
    reasons.push(`Dormant (${daysSinceActivity}d since activity)`);
  } else if (signals.signup_count > 0 || signals.transaction_count > 0) {
    status = 'active_free';
  }

  // === Cleanup priority ===
  let priority = 0;
  if (status === 'active_paid') {
    priority = 80;
    if (daysSinceTxn <= 30) priority += 15;     // very recent = ongoing charges
    if (signals.transaction_count >= 3) priority += 5; // recurring
  } else if (status === 'active_free' && signals.security_count > 0) {
    priority = 55;
  } else if (status === 'dormant') {
    priority = 35; // proven account, no longer needed
  } else if (status === 'newsletter_only') {
    priority = 20;
  } else if (status === 'active_free') {
    priority = 45;
  } else {
    priority = 5;
  }
  priority = Math.min(100, priority);

  return {
    signals,
    confidence,
    activity_status: status,
    cleanup_priority: priority,
    reasons,
  };
}
