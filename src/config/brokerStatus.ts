// Canonical status taxonomy for broker scan results
// Shared between frontend and backend

export const STATUS_V2 = [
  "found",
  "possible_match",
  "not_found",
  "blocked",
  "rate_limited",
  "provider_error",
  "timeout",
  "parse_failed",
  "request_failed",
  "unknown",
] as const;

export type StatusV2 = (typeof STATUS_V2)[number];

export const ERROR_CODE = [
  "blocked",
  "rate_limited",
  "provider_error",
  "timeout",
  "parse_failed",
  "request_failed",
] as const;

export type ErrorCode = (typeof ERROR_CODE)[number];

export const DETECTION_METHODS = [
  "direct",
  "browserless",
  "serp",
  "manual",
] as const;

export type DetectionMethod = (typeof DETECTION_METHODS)[number];

// UI display mappings
export const statusLabel: Record<StatusV2, string> = {
  found: "Exposed",
  possible_match: "Possible exposure",
  not_found: "Not found",
  blocked: "Blocked",
  rate_limited: "Rate limited",
  provider_error: "Scan service error",
  timeout: "Timeout",
  parse_failed: "Parse failed",
  request_failed: "Request failed",
  unknown: "Unknown",
};

export const statusTone: Record<StatusV2, "good" | "warn" | "bad" | "neutral"> = {
  found: "good",
  possible_match: "warn",
  not_found: "neutral",
  blocked: "bad",
  rate_limited: "bad",
  provider_error: "bad",
  timeout: "bad",
  parse_failed: "warn",
  request_failed: "bad",
  unknown: "neutral",
};

export const methodLabel: Record<DetectionMethod, string> = {
  direct: "Direct",
  browserless: "Browserless",
  serp: "SERP",
  manual: "Manual",
};

// Status badge colors using semantic tokens
export const statusBadgeClasses: Record<StatusV2, string> = {
  found: "bg-destructive/10 text-destructive border-destructive/30",
  possible_match: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  not_found: "bg-green-500/10 text-green-600 border-green-500/30",
  blocked: "bg-muted text-muted-foreground border-border",
  rate_limited: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  provider_error: "bg-muted text-muted-foreground border-border",
  timeout: "bg-muted text-muted-foreground border-border",
  parse_failed: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  request_failed: "bg-muted text-muted-foreground border-border",
  unknown: "bg-muted text-muted-foreground border-border",
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  FOUND: 0.60,
  POSSIBLE_MATCH: 0.45,
} as const;
