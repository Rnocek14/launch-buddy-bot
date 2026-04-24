/**
 * Frontend types & helpers for service intelligence signals.
 * Mirrors supabase/functions/_shared/subject-classifier.ts.
 */

export type SignalType =
  | 'signup'
  | 'transaction'
  | 'security'
  | 'newsletter'
  | 'policy'
  | 'shipping'
  | 'social'
  | 'unknown';

export type ActivityStatus =
  | 'active_paid'
  | 'active_free'
  | 'dormant'
  | 'newsletter_only'
  | 'unknown';

export interface ServiceSignals {
  signup_count: number;
  transaction_count: number;
  security_count: number;
  newsletter_count: number;
  policy_count: number;
  shipping_count: number;
  social_count: number;
  unknown_count: number;
  total: number;
  last_signup_at?: string;
  last_transaction_at?: string;
  last_security_at?: string;
  last_activity_at?: string;
  signup_sample?: string;
  transaction_sample?: string;
  security_sample?: string;
}

export const ACTIVITY_LABELS: Record<ActivityStatus, { label: string; color: string }> = {
  active_paid: { label: 'Active subscription', color: 'destructive' },
  active_free: { label: 'Active account', color: 'default' },
  dormant: { label: 'Dormant', color: 'secondary' },
  newsletter_only: { label: 'Newsletter only', color: 'outline' },
  unknown: { label: 'Detected', color: 'outline' },
};

export function activityBadge(status: ActivityStatus | null | undefined) {
  return ACTIVITY_LABELS[status ?? 'unknown'];
}

export function priorityLabel(priority: number | null | undefined): string {
  const p = priority ?? 0;
  if (p >= 80) return 'High priority';
  if (p >= 50) return 'Medium priority';
  if (p >= 20) return 'Low priority';
  return 'Minimal';
}
