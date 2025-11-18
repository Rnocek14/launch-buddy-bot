/**
 * Centralized Stripe pricing configuration
 * Single source of truth for all pricing-related constants
 */

export const STRIPE_PRICES = {
  PRO_ANNUAL: {
    id: "price_1SUqvlPwo7CiaABewIGGxC79",
    name: "Pro Annual",
    amount: 49,
    currency: "USD",
    interval: "year",
    displayPrice: "$49/year",
    monthlyEquivalent: "$4/month",
  },
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PRO: "pro",
} as const;

export const FREE_TIER_LIMITS = {
  DELETION_REQUESTS_PER_MONTH: 3,
  EMAIL_CONNECTIONS: 1,
} as const;

export const PRO_FEATURES = [
  "Unlimited deletion requests",
  "Deep AI Scan (finds 2-3× more accounts)",
  "Connect and scan up to 3 email addresses",
  "Complete inbox history analysis",
  "Priority deletion processing",
  "Monthly automatic rescans",
  "Priority email support",
] as const;

/**
 * Analytics event names for conversion tracking
 */
export const TRACKING_EVENTS = {
  USER_SIGNUP: "user_signup",
  EMAIL_CONNECTED: "email_connected",
  SCAN_COMPLETED: "scan_completed",
  CHECKOUT_INITIATED: "checkout_initiated",
  UPGRADE_TO_PRO: "upgrade_to_pro",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
} as const;
