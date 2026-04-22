/**
 * Centralized Stripe pricing configuration
 * Single source of truth for all pricing-related constants
 * 
 * Three-tier model:
 * - Free: 1 email, 3 deletions/month, no broker scanning
 * - Pro: 3 emails, unlimited deletions, no broker scanning
 * - Complete: 5 emails, unlimited deletions, broker scanning
 */

export const STRIPE_PRICES = {
  // Legacy prices (for grandfathered users)
  LEGACY_PRO_ANNUAL: {
    id: "price_1SUqvlPwo7CiaABewIGGxC79",
    name: "Pro Annual (Legacy)",
    amount: 49,
    currency: "USD",
    interval: "year",
    tier: "pro",
  },
  LEGACY_PRO_MONTHLY: {
    id: "price_1SUW44Pwo7CiaABeCXvND0Qj",
    name: "Pro Monthly (Legacy)",
    amount: 9.99,
    currency: "USD",
    interval: "month",
    tier: "pro",
  },
  // New Pro tier prices
  PRO_ANNUAL: {
    id: "price_1Smd2JPwo7CiaABexEEYZMFn",
    name: "Pro Annual",
    amount: 79,
    currency: "USD",
    interval: "year",
    displayPrice: "$79/year",
    monthlyEquivalent: "$6.58/month",
    tier: "pro",
  },
  PRO_MONTHLY: {
    id: "price_1Smd2KPwo7CiaABeBeqI5MAG",
    name: "Pro Monthly",
    amount: 12.99,
    currency: "USD",
    interval: "month",
    displayPrice: "$12.99/month",
    monthlyEquivalent: null,
    tier: "pro",
  },
  // Complete tier prices
  COMPLETE_ANNUAL: {
    id: "price_1Smd2MPwo7CiaABemCv3b6Lj",
    name: "Complete Annual",
    amount: 129,
    currency: "USD",
    interval: "year",
    displayPrice: "$129/year",
    monthlyEquivalent: "$10.75/month",
    tier: "complete",
  },
  COMPLETE_MONTHLY: {
    id: "price_1Smd2NPwo7CiaABeyV6KFls0",
    name: "Complete Monthly",
    amount: 19.99,
    currency: "USD",
    interval: "month",
    displayPrice: "$19.99/month",
    monthlyEquivalent: null,
    tier: "complete",
  },
  // Family tier — protects up to 5 family members
  FAMILY_ANNUAL: {
    id: "price_1TP42pPwo7CiaABejT1heX0l",
    name: "Family Annual",
    amount: 179,
    currency: "USD",
    interval: "year",
    displayPrice: "$179/year",
    monthlyEquivalent: "$14.92/month",
    tier: "family",
  },
  // One-time SKU — Parent Protection Scan
  PARENT_SCAN_ONETIME: {
    id: "price_1TP42rPwo7CiaABegxnVGeL2",
    name: "Parent Protection Scan",
    amount: 39,
    currency: "USD",
    interval: "one_time",
    displayPrice: "$39 one-time",
    monthlyEquivalent: null,
    tier: "one_time",
  },
} as const;

// Map price IDs to tiers for subscription checking
export const PRICE_ID_TO_TIER: Record<string, SubscriptionTier> = {
  // Legacy prices map to pro
  [STRIPE_PRICES.LEGACY_PRO_ANNUAL.id]: "pro",
  [STRIPE_PRICES.LEGACY_PRO_MONTHLY.id]: "pro",
  // New Pro prices
  [STRIPE_PRICES.PRO_ANNUAL.id]: "pro",
  [STRIPE_PRICES.PRO_MONTHLY.id]: "pro",
  // Complete prices
  [STRIPE_PRICES.COMPLETE_ANNUAL.id]: "complete",
  [STRIPE_PRICES.COMPLETE_MONTHLY.id]: "complete",
  // Family tier
  [STRIPE_PRICES.FAMILY_ANNUAL.id]: "family",
};

export type BillingInterval = "month" | "year";
export type SubscriptionTier = "free" | "pro" | "complete" | "family";

export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PRO: "pro",
  COMPLETE: "complete",
  FAMILY: "family",
} as const;

// Tier limits
export const TIER_LIMITS = {
  free: {
    emailConnections: 1,
    deletionsPerMonth: 3,
    brokerScanning: false,
    deepScan: false,
    monthlyRescans: false,
    prioritySupport: false,
  },
  pro: {
    emailConnections: 3,
    deletionsPerMonth: null, // unlimited
    brokerScanning: false,
    deepScan: true,
    monthlyRescans: true,
    prioritySupport: false,
  },
  complete: {
    emailConnections: 5,
    deletionsPerMonth: null, // unlimited
    brokerScanning: true,
    deepScan: true,
    monthlyRescans: true,
    prioritySupport: true,
  },
  family: {
    emailConnections: 25, // 5 members × 5 emails
    deletionsPerMonth: null,
    brokerScanning: true,
    deepScan: true,
    monthlyRescans: true,
    prioritySupport: true,
    familyMembers: 5,
  },
} as const;

export const FREE_TIER_LIMITS = {
  DELETION_REQUESTS_PER_MONTH: 3,
  EMAIL_CONNECTIONS: 1,
} as const;

// Feature lists for each tier
export const FREE_FEATURES = [
  "Connect and scan 1 email account",
  "See all discovered services",
  "Complete privacy contact details",
  "Risk score & analytics",
  "3 deletion requests/month",
  "Shareable privacy report",
] as const;

export const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited deletion requests",
  "Deep AI Scan (finds 2-3× more accounts)",
  "Connect and scan up to 3 email addresses",
  "Complete inbox history analysis",
  "Priority deletion processing",
  "Monthly automatic rescans",
] as const;

export const COMPLETE_FEATURES = [
  "Everything in Pro, plus:",
  "Data Broker Scanning (20+ sites)",
  "Guided opt-out instructions",
  "Connect up to 5 email addresses",
  "Priority email support",
  "Monthly broker rescans",
] as const;

export const FAMILY_FEATURES = [
  "Everything in Complete, for 5 family members:",
  "Protect parents, partner, kids, or housemates",
  "Each member gets their own private dashboard",
  "Up to 5 email accounts per member (25 total)",
  "Data broker scanning for every member",
  "Family privacy score & shared insights",
  "One bill, one subscription",
] as const;

export const PARENT_SCAN_FEATURES = [
  "One-time deep scan of their email",
  "Full data broker check (20+ sites)",
  "Breach exposure report",
  "Printable PDF action plan",
  "Senior-friendly explanations",
  "No subscription required",
] as const;

// Enterprise pricing tiers
export const ENTERPRISE_PRICING = {
  TIER_1: { seats: "25-100", pricePerUser: 49, label: "Starter" },
  TIER_2: { seats: "100-500", pricePerUser: 39, label: "Professional" },
  TIER_3: { seats: "500-1000", pricePerUser: 29, label: "Business" },
  TIER_4: { seats: "1000+", pricePerUser: "Custom", label: "Enterprise" },
} as const;

/**
 * Analytics event names for conversion tracking
 */
export const TRACKING_EVENTS = {
  USER_SIGNUP: "user_signup",
  EMAIL_CONNECTED: "email_connected",
  SCAN_COMPLETED: "scan_completed",
  CHECKOUT_INITIATED: "checkout_initiated",
  UPGRADE_TO_PRO: "upgrade_to_pro",
  UPGRADE_TO_COMPLETE: "upgrade_to_complete",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  SHARE_RESULT_GENERATED: "share_result_generated",
  SHARE_RESULT_DOWNLOADED: "share_result_downloaded",
  SHARE_RESULT_COPIED: "share_result_copied",
  SHARE_RESULT_SOCIAL: "share_result_social",
  RESULT_PAGE_VIEWED: "result_page_viewed",
  RESULT_PAGE_CONVERSION: "result_page_conversion",
  PUBLIC_RESULT_CREATED: "public_result_created",
  // ROI Calculator events
  ROI_CALCULATOR_OPENED: "roi_calculator_opened",
  ROI_CALCULATOR_COMPLETED: "roi_calculator_completed",
  ROI_CALCULATOR_CTA_CLICKED: "roi_calculator_cta_clicked",
  ROI_REPORT_DOWNLOADED: "roi_report_downloaded",
} as const;
