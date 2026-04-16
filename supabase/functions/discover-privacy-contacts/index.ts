import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://esm.sh/linkedom@0.16.7/worker";
import type { VendorDetection } from '../_shared/probes.ts';
import {
  probeSecurityTxt as probeSecurityTxtShared,
  probeSitemap as probeSitemapShared,
  probeSitemapUrl as probeSitemapUrlShared,
  probeRobotsTxt as probeRobotsTxtShared,
  detectVendor as detectVendorShared,
  precisionAt5,
  toConfidence as toConfidenceShared,
  extractSmartContentWindow,
  validatePolicyUrl,
  isOfficialDomain,
  isSoft404,
} from '../_shared/probes.ts';
import { detectLanguage, rankByLocale } from '../_shared/lang.ts';
import { getSitemapCache, setSitemapCache } from '../_shared/cache.ts';
import { getVendorHint, getDomainHint } from '../_shared/vendor_hints.ts';
import { isQuarantined, addToQuarantine } from '../_shared/quarantine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Circuit-breaker toggles with safe parsing
const bool = (v?: string) => (v ?? '').toLowerCase() === 'true';
const int = (v?: string, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;

const DISABLE_METRICS = bool(Deno.env.get('DISCOVERY_DISABLE_METRICS'));
const DOMAIN_BUDGET_MS = Math.min(60000, Math.max(3000, int(Deno.env.get('DISCOVERY_DOMAIN_BUDGET_MS'), 25000)));

// Phase 1.2: Feature flags for probes
// Probes default ON — set env to 'false' to disable
const boolDefault = (v?: string, def = true) => v === undefined ? def : v.toLowerCase() === 'true';
const ENABLE_SECURITY_TXT = boolDefault(Deno.env.get('PROBE_SECURITY_TXT'), true);
const ENABLE_SITEMAP = boolDefault(Deno.env.get('PROBE_SITEMAP'), true);
const ENABLE_VENDOR_DET = boolDefault(Deno.env.get('DETECT_VENDOR'), true);

// Phase 1.3: Feature flags for language and cache
const DETECT_LANG = boolDefault(Deno.env.get('DETECT_LANG'), true);
const CACHE_SITEMAP = boolDefault(Deno.env.get('CACHE_SITEMAP'), true);

// Phase 1.3: Tail latency guardrails
const TAIL_P95_GOAL_MS = Math.min(8000, Math.max(3000, int(Deno.env.get('TAIL_P95_GOAL_MS'), 5000)));
const ATTEMPT_TIMEOUT_MS = Math.min(15000, Math.max(2000, int(Deno.env.get('ATTEMPT_TIMEOUT_MS'), 8000)));
const EARLY_STOP_CONFIDENCE = Math.min(100, Math.max(30, int(Deno.env.get('EARLY_STOP_CONFIDENCE'), 70)));

// Phase 1.4: Tier-2 retries
const ENABLE_T2 = boolDefault(Deno.env.get('ENABLE_T2'), true); // Default ON — T2 retries for failed T1
const T2_RETRY_ON = new Set(['bot_protection', 'captcha', 'POLICY_NOT_FOUND', 'NETWORK_ERROR']);

// Phase 1.3: Slow-domain overrides parser
const parseOverrides = (raw?: string) => {
  if (!raw) return new Map<string, number>();
  return new Map(
    raw.split(',').map(pair => {
      const [d, ms] = pair.split(':').map(s => s.trim());
      const v = Math.min(60000, Math.max(3000, Number(ms) || 0));
      return [d.toLowerCase(), v];
    })
  );
};
const DOMAIN_BUDGET_OVERRIDES = parseOverrides(Deno.env.get('SLOW_BUDGET_OVERRIDES'));

// Constants
const METHOD_USED = 't1' as const;

interface ContactFinding {
  contact_type: 'email' | 'form' | 'phone' | 'other';
  value: string;
  confidence: 'high' | 'medium';
  reasoning: string;
}

interface ScoredLink {
  url: string;
  score: number;
  linkText: string;
  location: 'footer' | 'header' | 'body';
}

interface StructuredError {
  error_code: string;
  error_type: 'no_policy_found' | 'fetch_failed' | 'bot_protection' | 'invalid_content' | 'ai_error' | 'validation_failed';
  message: string;
  suggested_action: 'manual_entry' | 'try_again_later' | 'contact_support' | 'provide_url';
  details?: any;
}

// Phase 1.1: Constants
// Rotate user agents to reduce bot detection fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];
const USER_AGENT = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const STRIP_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref', 'ref_src', 'referrer'];
const REDACT_PARAMS = ['email', 'e', 'user', 'token', 'auth', 'code', 'sid', 'session', 'uid'];

// Curated privacy contacts for domains that consistently block automated discovery
const CURATED_CONTACTS: Record<string, Array<{ contact_type: string; value: string; confidence: string; reasoning: string }>> = {
  'bestbuy.com': [
    { contact_type: 'form', value: 'https://www.bestbuy.com/site/privacy-policy/data-request/pcmcat778300050498.c', confidence: 'high', reasoning: 'Best Buy official DSAR form from privacy policy' },
    { contact_type: 'email', value: 'privacy@bestbuy.com', confidence: 'high', reasoning: 'Best Buy privacy team email' },
  ],
  'spectrum.com': [
    { contact_type: 'form', value: 'https://www.spectrum.com/policies/your-privacy-rights-opt-out', confidence: 'high', reasoning: 'Spectrum official privacy rights form' },
    { contact_type: 'email', value: 'Privacy@charter.com', confidence: 'high', reasoning: 'Charter/Spectrum privacy team email' },
  ],
  'walmart.com': [
    { contact_type: 'form', value: 'https://corporate.walmart.com/privacy-security/walmart-privacy-notice/data-request', confidence: 'high', reasoning: 'Walmart official data request form' },
    { contact_type: 'email', value: 'privacy@walmart.com', confidence: 'high', reasoning: 'Walmart privacy team email' },
  ],
  'target.com': [
    { contact_type: 'form', value: 'https://www.target.com/guest-privacy-rights', confidence: 'high', reasoning: 'Target official guest privacy rights form' },
    { contact_type: 'email', value: 'privacy@target.com', confidence: 'high', reasoning: 'Target privacy team email' },
  ],
  'amazon.com': [
    { contact_type: 'form', value: 'https://www.amazon.com/hz/privacy-central/data-requests/preview.html', confidence: 'high', reasoning: 'Amazon Privacy Central data request form' },
  ],
  'apple.com': [
    { contact_type: 'form', value: 'https://privacy.apple.com/', confidence: 'high', reasoning: 'Apple Privacy Portal for data requests' },
  ],
  'google.com': [
    { contact_type: 'form', value: 'https://myaccount.google.com/delete-services-or-account', confidence: 'high', reasoning: 'Google account deletion portal' },
  ],
  'facebook.com': [
    { contact_type: 'form', value: 'https://www.facebook.com/help/delete_account', confidence: 'high', reasoning: 'Facebook account deletion page' },
  ],
  'meta.com': [
    { contact_type: 'form', value: 'https://www.facebook.com/help/delete_account', confidence: 'high', reasoning: 'Meta/Facebook account deletion page' },
  ],
  'netflix.com': [
    { contact_type: 'email', value: 'privacy@netflix.com', confidence: 'high', reasoning: 'Netflix privacy team email from privacy policy' },
  ],
  'hulu.com': [
    { contact_type: 'email', value: 'privacy@hulu.com', confidence: 'high', reasoning: 'Hulu privacy team email' },
  ],
  'linkedin.com': [
    { contact_type: 'form', value: 'https://www.linkedin.com/help/linkedin/ask/TSO-CLOSE-ACCOUNT', confidence: 'high', reasoning: 'LinkedIn account closure form' },
  ],
  'twitter.com': [
    { contact_type: 'form', value: 'https://help.twitter.com/forms/privacy', confidence: 'high', reasoning: 'X/Twitter privacy request form' },
  ],
  'x.com': [
    { contact_type: 'form', value: 'https://help.twitter.com/forms/privacy', confidence: 'high', reasoning: 'X/Twitter privacy request form' },
  ],
  'microsoft.com': [
    { contact_type: 'form', value: 'https://www.microsoft.com/en-us/concern/privacy', confidence: 'high', reasoning: 'Microsoft privacy concern form' },
  ],
  'adobe.com': [
    { contact_type: 'form', value: 'https://www.adobe.com/privacy/privacyrequest.html', confidence: 'high', reasoning: 'Adobe privacy request form' },
  ],
  'paypal.com': [
    { contact_type: 'form', value: 'https://www.paypal.com/myaccount/privacy/privacyhub', confidence: 'high', reasoning: 'PayPal Privacy Hub for data requests' },
  ],
  'spotify.com': [
    { contact_type: 'form', value: 'https://www.spotify.com/account/privacy/', confidence: 'high', reasoning: 'Spotify privacy settings page' },
    { contact_type: 'email', value: 'privacy@spotify.com', confidence: 'high', reasoning: 'Spotify privacy team email' },
  ],
  'uber.com': [
    { contact_type: 'form', value: 'https://privacy.uber.com/privacy/requests', confidence: 'high', reasoning: 'Uber privacy request portal' },
  ],
  'airbnb.com': [
    { contact_type: 'form', value: 'https://www.airbnb.com/help/article/2273', confidence: 'high', reasoning: 'Airbnb data deletion help article with request process' },
  ],
  'doordash.com': [
    { contact_type: 'form', value: 'https://help.doordash.com/s/privacy-requests', confidence: 'high', reasoning: 'DoorDash privacy requests form' },
    { contact_type: 'email', value: 'privacy@doordash.com', confidence: 'high', reasoning: 'DoorDash privacy team email' },
  ],
};
const MAX_REDIRECT_DEPTH = 1;
const VALIDATION_TIMEOUT_MS = 5000;
const FETCH_TIMEOUT_MS = 7000;


// Phase 1.1: i18n keyword expansion
const PRIVACY_KEYWORDS = {
  en: {
    high: ['privacy-policy', 'privacy policy', 'privacypolicy', 'data-request', 'dsar', 'delete-data', 'data deletion'],
    medium: ['privacy', 'gdpr', 'ccpa', 'data-protection', 'personal-data', 'privacy-notice', 'data protection'],
    low: ['legal', 'terms', 'about', 'help']
  },
  es: {
    high: ['política de privacidad', 'solicitud de datos', 'eliminación de datos'],
    medium: ['privacidad', 'protección de datos', 'aviso de privacidad'],
    low: ['legal', 'términos']
  },
  fr: {
    high: ['politique de confidentialité', 'demande de données', 'suppression de données'],
    medium: ['confidentialité', 'protection des données'],
    low: ['légal', 'conditions']
  },
  de: {
    high: ['datenschutzerklärung', 'datenanfrage', 'datenlöschung'],
    medium: ['datenschutz', 'datenschutzrichtlinie'],
    low: ['rechtliches', 'bedingungen']
  },
  it: {
    high: ['informativa sulla privacy', 'richiesta di dati', 'cancellazione dei dati'],
    medium: ['privacy', 'protezione dei dati'],
    low: ['legale', 'termini']
  },
  jp: {
    high: ['プライバシーポリシー', '個人情報保護方針', 'データ削除'],
    medium: ['プライバシー', '個人情報'],
    low: ['法的事項']
  }
};

// Phase 1.2: Legacy detectVendor (now redirects to shared probes)
function detectVendor(url: string): { platform_detected: string; pre_fill_supported: boolean } | null {
  if (!ENABLE_VENDOR_DET) return null;
  const result = detectVendorShared({ url });
  if (result.platform_detected === 'none') return null;
  return { platform_detected: result.platform_detected, pre_fill_supported: result.pre_fill_supported };
}

// Phase 1.2: Legacy toConfidence (now redirects to shared probes)
function toConfidence(score: number, url: string, vendor?: string): 'high' | 'medium' | 'low' {
  return toConfidenceShared(score, url, vendor);
}

// Phase 1.1 Refinement #2: <base> tag support
function resolveAgainstBase(href: string, docUrl: string, doc?: any): string {
  try {
    const baseTag = doc?.querySelector?.('base[href]');
    const baseHref = baseTag?.getAttribute?.('href') || docUrl;
    return new URL(href, baseHref).toString();
  } catch {
    return '';
  }
}

// Phase 1.1 Refinement #3: www/apex normalization
function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith('www.') ? lower.slice(4) : lower;
}

// Phase 1.1 Refinement #3: URL key for deduplication (normalizes www/apex)
function urlKey(urlString: string): string {
  try {
    const url = new URL(urlString);
    url.hostname = normalizeHost(url.hostname);
    url.hash = ''; // ignore fragments for dedupe
    return url.toString();
  } catch {
    return urlString;
  }
}

// Phase 1.2: PII-safe URL redaction for metrics
function redactUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    url.hash = '';
    
    // Redact sensitive params
    for (const key of [...url.searchParams.keys()]) {
      if (REDACT_PARAMS.includes(key.toLowerCase())) {
        url.searchParams.set(key, 'REDACTED');
      }
    }
    return url.toString();
  } catch {
    return urlString;
  }
}

// Phase 1.1 Refinement #6: Logging hygiene
function sanitizeForLog(urlString: string): string {
  return redactUrl(urlString);
}

// Phase 1.1: URL canonicalization (enhanced with base tag support)
function canonicalizeUrl(href: string, pageUrl: string, doc?: any): string {
  try {
    // Resolve relative URL (respecting <base> tag)
    const abs = resolveAgainstBase(href, pageUrl, doc);
    if (!abs) return '';
    
    const urlObj = new URL(abs);
    
    // Phase 1.1 Refinement #3: Normalize host (www/apex)
    urlObj.hostname = normalizeHost(urlObj.hostname);
    
    // Phase 1.1 Refinement #2: Strip tracking parameters
    STRIP_PARAMS.forEach(param => urlObj.searchParams.delete(param));
    
    // Drop fragments for fetch attempts (keep for display only)
    urlObj.hash = '';
    
    // Remove trailing slash (but keep if it's just the domain)
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    return urlObj.toString();
  } catch (e) {
    console.warn(`[Canonicalize] Invalid URL: ${href}`, e);
    return '';
  }
}

// Phase 1.1 Refinement #4: Enhanced validation ladder
interface ValidateResult {
  valid: boolean;
  status?: number;
  contentType?: string;
  isPDF?: boolean;
  finalUrl?: string;
  redirected?: boolean;
}

async function smartValidateUrl(url: string, depth = 0): Promise<ValidateResult> {
  // Phase 1.1 Refinement #4: Cap redirects to prevent loops
  if (depth > MAX_REDIRECT_DEPTH) {
    console.warn(`[Validate] Exceeded max redirect depth (${MAX_REDIRECT_DEPTH}) for ${sanitizeForLog(url)}`);
    return { valid: false, status: 310 }; // Custom status for "too many redirects"
  }

  try {
    // Try HEAD first
    let response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
      redirect: 'manual', // Handle redirects manually
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
      }
    });

    // Phase 1.1 Refinement #4: Follow one redirect manually
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) {
        const redirectUrl = location.startsWith('http') ? location : new URL(location, url).toString();
        console.log(`[Validate] Following redirect: ${sanitizeForLog(url)} → ${sanitizeForLog(redirectUrl)}`);
        return await smartValidateUrl(redirectUrl, depth + 1);
      }
    }

    // Phase 1.1 Refinement #4: If HEAD blocked or returns empty content, try GET with Range
    const headEmpty = response.headers.get('content-length') === '0';
    if (!response.ok || headEmpty || [403, 405].includes(response.status)) {
      console.log(`[Validate] HEAD ${response.ok ? 'empty' : 'blocked'} (${response.status}), trying GET with Range...`);
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-8192',
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: 'follow'
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const isPDF = contentType.toLowerCase().includes('application/pdf');
    
    // Phase 1.1 Refinement #4: Accept 206 (partial content) as valid
    const valid = response.ok || response.status === 206;

    return {
      valid,
      status: response.status,
      contentType,
      isPDF,
      finalUrl: response.url !== url ? response.url : undefined,
      redirected: response.url !== url
    };
  } catch (error) {
    console.warn(`[Validate] Error validating ${sanitizeForLog(url)}:`, error);
    return { valid: false };
  }
}

// Phase 1.1: Better privacy policy detection heuristics
function isPrivacyPolicy(html: string, url: string): { isPolicy: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check <title> tag
    const title = doc.querySelector('title')?.textContent?.toLowerCase() || '';
    if (title.match(/privacy\s*(policy|notice|statement)/i)) {
      score += 20;
      reasons.push('Title contains privacy policy keywords');
    }

    // Check <h1> tags
    const h1Elements = Array.from(doc.querySelectorAll('h1'));
    const h1Texts = h1Elements.map((el: any) => el.textContent?.toLowerCase() || '');
    if (h1Texts.some(text => text.match(/privacy\s*(policy|notice)/i))) {
      score += 20;
      reasons.push('H1 heading contains privacy policy keywords');
    }

    // Check for table of contents structure (common in privacy policies)
    const h2Elements = Array.from(doc.querySelectorAll('h2'));
    const anchorLinks = Array.from(doc.querySelectorAll('a[href^="#"]'));
    
    if (h2Elements.length >= 5 && anchorLinks.length >= 3) {
      score += 15;
      reasons.push('Document has TOC structure (multiple sections with anchor links)');
    }

    // Check for privacy policy sections - use innerHTML or fallback to original html
    const bodyText = (doc.body as any)?.textContent?.toLowerCase() || html.toLowerCase();
    const privacySections = [
      'information we collect',
      'how we use',
      'data protection',
      'your rights',
      'cookies',
      'data retention',
      'third parties',
      'contact us'
    ];

    const foundSections = privacySections.filter(section => bodyText.includes(section));
    
    if (foundSections.length >= 4) {
      score += 25;
      reasons.push(`Contains ${foundSections.length} common privacy policy sections`);
    } else if (foundSections.length >= 2) {
      score += 10;
      reasons.push(`Contains ${foundSections.length} privacy policy sections`);
    }

    // Check URL path
    if (url.match(/privacy|gdpr|ccpa|data-protection/i)) {
      score += 10;
      reasons.push('URL path indicates privacy policy');
    }

    // Check for GDPR/CCPA keywords
    if (bodyText.match(/gdpr|general data protection regulation/i)) {
      score += 5;
      reasons.push('Contains GDPR references');
    }
    if (bodyText.match(/ccpa|california consumer privacy act/i)) {
      score += 5;
      reasons.push('Contains CCPA references');
    }

    const isPolicy = score >= 30; // Threshold for confidence
    return { isPolicy, score, reasons };
  } catch (e) {
    console.warn('[Privacy Detection] Error parsing HTML:', e);
    // Fallback to simple text matching
    const hasPrivacyKeywords = html.toLowerCase().includes('privacy') && 
                               html.toLowerCase().includes('personal data');
    return { isPolicy: hasPrivacyKeywords, score: hasPrivacyKeywords ? 30 : 0, reasons: ['Fallback text match'] };
  }
}

// Phase 1.1 Enhanced: Score and extract privacy policy URLs from HTML using DOM parser
// With footer-first optimization: if footer has strong privacy links, skip body noise
function extractAndScorePrivacyLinks(html: string, baseDomain: string, pageUrl: string): ScoredLink[] {
  const scoredLinks: ScoredLink[] = [];
  const normalizedDomain = normalizeHost(baseDomain);
  const domainHint = getDomainHint(normalizedDomain);
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Detect site language from <html lang="...">
    const htmlLang = doc.documentElement.getAttribute('lang')?.substring(0, 2).toLowerCase() || 'en';
    const languageKeywords = (PRIVACY_KEYWORDS as any)[htmlLang] || PRIVACY_KEYWORDS.en;

    // Footer-first: extract footer links separately
    const footerElements = doc.querySelectorAll('footer a');
    const footerLinks: ScoredLink[] = [];

    const scoreAnchor = (anchor: any, isInFooter: boolean): ScoredLink | null => {
      let href = anchor.getAttribute('href');
      if (!href) return null;

      const linkText = anchor.textContent?.trim() || '';
      
      if (href.includes('mailto:') || href.includes('javascript:') || href.includes('tel:') || href.startsWith('#')) {
        return null;
      }

      const canonicalHref = canonicalizeUrl(href, pageUrl, doc);
      if (!canonicalHref) return null;

      try {
        const urlObj = new URL(canonicalHref);
        if (urlObj.pathname === '/' && urlObj.search === '' && urlObj.hash) return null;
        // Domain validation: reject links to other domains
        if (!isOfficialDomain(urlObj.hostname, baseDomain)) return null;
      } catch {
        return null;
      }

      let score = 0;
      const combined = (canonicalHref + ' ' + linkText).toLowerCase();
      const lowerUrl = canonicalHref.toLowerCase();
      const lowerText = linkText.toLowerCase();

      if (domainHint?.exclude_paths) {
        const urlPath = new URL(canonicalHref).pathname;
        if (domainHint.exclude_paths.some(path => urlPath.includes(path))) return null;
      }
      
      const productPaths = ['/products/', '/shop/', '/p/', '/cart', '/checkout', '/store/', '/category/', '/browse/'];
      const productKeywords = ['shop', 'buy', 'cart', 'checkout', 'sale', 'price', 'product', 'for sale', 'buy now'];
      const legalPaths = ['/legal/', '/privacy/', '/policies/', '/about/privacy', '/privacy-policy', '/privacidad', '/datenschutz'];
      
      let penalty = 0;
      if (productPaths.some(path => lowerUrl.includes(path))) penalty += 20;
      if (productKeywords.some(kw => lowerText.includes(kw) || lowerUrl.includes(kw))) penalty += 15;
      if (/[\$€£¥]/.test(linkText)) penalty += 10;
      penalty = Math.min(penalty, 40);

      languageKeywords.high.forEach((keyword: string) => {
        if (combined.includes(keyword.toLowerCase())) score += 15;
      });
      languageKeywords.medium.forEach((keyword: string) => {
        if (combined.includes(keyword.toLowerCase())) score += 10;
      });
      languageKeywords.low.forEach((keyword: string) => {
        if (combined.includes(keyword.toLowerCase())) score += 5;
      });
      
      if (legalPaths.some(path => lowerUrl.includes(path))) score += 15;
      
      if (domainHint?.boost_paths) {
        const urlPath = new URL(canonicalHref).pathname;
        if (domainHint.boost_paths.some(path => urlPath.includes(path))) {
          score += 10;
        }
      }
      
      if (domainHint?.privacy_url_pattern && canonicalHref.includes(domainHint.privacy_url_pattern)) {
        score += 20;
      }

      const location = isInFooter ? 'footer' : 'body';
      if (isInFooter) score += 10;

      const canonicalLink = doc.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        const canonicalUrl = canonicalLink.getAttribute('href');
        if (canonicalUrl && canonicalizeUrl(canonicalUrl, pageUrl, doc) === canonicalHref) {
          score += 5;
        }
      }

      const lowerLinkText = linkText.toLowerCase();
      if (lowerLinkText === 'privacy policy' || lowerLinkText === 'privacy' ||
          lowerLinkText === 'política de privacidad' || lowerLinkText === 'privacidad' ||
          lowerLinkText === 'politique de confidentialité' || lowerLinkText === 'confidentialité' ||
          lowerLinkText === 'datenschutzerklärung' || lowerLinkText === 'datenschutz' ||
          lowerLinkText === 'informativa sulla privacy' ||
          lowerLinkText === 'プライバシーポリシー') {
        score += 20;
      }

      const urlPath = canonicalHref.split('?')[0];
      if (urlPath.endsWith('/') || 
          urlPath === `https://${normalizedDomain}` || 
          urlPath === `https://www.${normalizedDomain}`) {
        score -= 10;
      }
      
      score = Math.max(score - penalty, -50);

      if (score > 0) {
        return { url: canonicalHref, score, linkText, location };
      }
      return null;
    };

    // Score footer links first
    footerElements.forEach((anchor: any) => {
      const link = scoreAnchor(anchor, true);
      if (link) footerLinks.push(link);
    });

    // Footer-first optimization: if footer has strong privacy links (score >= 25), use only those
    const strongFooterLinks = footerLinks.filter(l => l.score >= 25);
    if (strongFooterLinks.length > 0) {
      console.log(`[Footer-First] Found ${strongFooterLinks.length} strong footer privacy links, skipping body scan`);
      strongFooterLinks.sort((a, b) => b.score - a.score);
      const seen = new Set<string>();
      return strongFooterLinks.filter(link => {
        const key = urlKey(link.url);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Fall through: score ALL anchors (including footer ones again for consistency)
    const allAnchors = doc.querySelectorAll('a');
    allAnchors.forEach((anchor: any) => {
      const isInFooter = !!(anchor.closest && anchor.closest('footer'));
      const link = scoreAnchor(anchor, isInFooter);
      if (link) scoredLinks.push(link);
    });

    // Sort by score descending
    scoredLinks.sort((a, b) => b.score - a.score);

    // Deduplicate using urlKey (normalizes www/apex)
    const seen = new Set<string>();
    const uniqueLinks = scoredLinks.filter(link => {
      const key = urlKey(link.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueLinks;
  } catch (e) {
    console.warn('[Link Extraction] Error parsing with DOM, falling back to regex:', e);
    
    // Fallback to regex-based extraction if DOM parsing fails
    return extractAndScorePrivacyLinksRegex(html, baseDomain, pageUrl);
  }
}

// Fallback: Regex-based extraction (kept for backward compatibility)
function extractAndScorePrivacyLinksRegex(html: string, baseDomain: string, pageUrl: string): ScoredLink[] {
  const scoredLinks: ScoredLink[] = [];
  
  const highPriorityKeywords = ['privacy-policy', 'privacy policy', 'privacypolicy', 'data-request', 'dsar', 'delete-data'];
  const mediumPriorityKeywords = ['privacy', 'gdpr', 'ccpa', 'data-protection', 'personal-data', 'privacy-notice'];
  const lowPriorityKeywords = ['legal', 'terms', 'about', 'help'];
  
  const footerRegex = /<footer[^>]*>(.*?)<\/footer>/gis;
  const footerMatch = footerRegex.exec(html);
  const footerHtml = footerMatch ? footerMatch[1] : '';
  
  const allAnchorsRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = allAnchorsRegex.exec(html)) !== null) {
    let href = match[1];
    const linkText = match[2].replace(/<[^>]+>/g, '').trim();
    
    if (href.includes('mailto:') || href.includes('javascript:') || href.includes('tel:') || href.startsWith('#')) {
      continue;
    }
    
    // Phase 1.1 Refinement #2: Canonicalize with base support (regex fallback doesn't have doc)
    const canonicalHref = canonicalizeUrl(href, pageUrl);
    if (!canonicalHref) continue;
    
    let score = 0;
    const combined = (canonicalHref + ' ' + linkText).toLowerCase();
    
    highPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) score += 15;
    });
    
    mediumPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) score += 10;
    });
    
    lowPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) score += 5;
    });
    
    const isInFooter = footerHtml.includes(match[0]);
    const location = isInFooter ? 'footer' : 'body';
    if (isInFooter) score += 10;
    
    if (linkText.toLowerCase() === 'privacy policy' || linkText.toLowerCase() === 'privacy') {
      score += 20;
    }
    
    const urlPath = canonicalHref.split('?')[0];
    const normalizedDomain = normalizeHost(baseDomain);
    if (urlPath.endsWith('/') || urlPath === `https://${normalizedDomain}`) {
      score -= 10;
    }
    
    if (score > 0) {
      scoredLinks.push({ url: canonicalHref, score, linkText, location });
    }
  }
  
  scoredLinks.sort((a, b) => b.score - a.score);
  
  const seen = new Set<string>();
  return scoredLinks.filter(link => {
    const key = urlKey(link.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper: Validate URL returns 200 (deprecated - use smartValidateUrl)
async function quickValidateUrl(url: string): Promise<{ valid: boolean; status?: number }> {
  const result = await smartValidateUrl(url);
  return { valid: result.valid, status: result.status };
}

// Phase 1.2: Legacy probes (now redirect to shared probes with feature flags)
async function probeSecurityTxt(domain: string): Promise<{ type: string; contact: string; url: string } | null> {
  if (!ENABLE_SECURITY_TXT) return null;
  const result = await probeSecurityTxtShared(domain);
  // Filter to only return security.txt type
  if (result && result.type === 'security.txt') {
    return result;
  }
  return null;
}

async function probeSitemap(domain: string): Promise<string[]> {
  if (!ENABLE_SITEMAP) return [];
  return await probeSitemapShared(domain);
}

// Phase 1.3: Attempt timeout wrapper
const withAttemptTimeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('attempt_timeout')), ms))]);

// Phase 1: Enhanced fetch with smart link discovery and scoring
async function trySimpleFetch(
  urlsToTry: string[], 
  domain: string,
  attemptTimeoutMs: number,
  earlyStopScore: number,
  cachedHomepageHtml?: string | null
): Promise<{ 
  content: string; 
  url: string; 
  discoveredUrls?: string[]; 
  policy_type?: string;
  attemptTimeouts: number;
  bestScore: number;
  failedUrls: Map<string, number>;
  html?: string;
  vendor?: VendorDetection | null;
  confidenceScore?: number;
  policy_source?: string;
} | null> {
  const attemptedUrls: string[] = [];
  const failedUrls: Map<string, number> = new Map();
  const startTime = Date.now();
  let attemptTimeouts = 0;
  let bestScore = -Infinity;
  let bestResult: { content: string; url: string; discoveredUrls?: string[]; policy_type?: string; html?: string; vendor?: VendorDetection | null; confidenceScore?: number; policy_source?: string } | null = null;
  
  // Phase 1.1 Refinement: Budget timer to prevent runaway discovery
  const budgetOk = () => (Date.now() - startTime) < DOMAIN_BUDGET_MS;
  
  for (const url of urlsToTry) {
    if (!budgetOk()) {
      console.warn(`[Phase 1] Budget exceeded (${DOMAIN_BUDGET_MS}ms), stopping discovery`);
      break;
    }
    
    console.log(`[Phase 1] Trying simple fetch: ${sanitizeForLog(url)}`);
    attemptedUrls.push(url);
    
    try {
      // Reuse cached homepage HTML if this is one of the homepage URLs
      const isHomepage = url === `https://${domain}` || url === `https://www.${domain}`;
      let pageResponse: Response;
      let usedCache = false;

      if (isHomepage && cachedHomepageHtml) {
        console.log(`[Phase 1] Using cached homepage HTML for ${sanitizeForLog(url)}`);
        pageResponse = new Response(cachedHomepageHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' }
        });
        usedCache = true;
      } else {
        const fetchWithH2Fallback = async (fetchUrl: string): Promise<Response> => {
          // More realistic browser headers to pass WAF checks
          const browserHeaders: Record<string, string> = {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          };
          try {
            return await fetch(fetchUrl, {
              headers: browserHeaders,
              redirect: 'follow',
              signal: AbortSignal.timeout(15000)
            });
          } catch (fetchErr) {
            const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
            // Retry with HTTP/1.1 on h2 stream errors
            if (errMsg.includes('http2 error') || errMsg.includes('stream error') || errMsg.includes('GOAWAY')) {
              console.log(`[Phase 1] H2 error, retrying with HTTP/1.1: ${sanitizeForLog(fetchUrl)}`);
              return await fetch(fetchUrl, {
                headers: {
                  ...browserHeaders,
                  'Connection': 'keep-alive',
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(15000),
                // @ts-ignore — Deno supports this to force HTTP/1.1
                client: undefined,
              });
            }
            throw fetchErr;
          }
        };
        const fetchPromise = fetchWithH2Fallback(url);
        pageResponse = await withAttemptTimeout(fetchPromise, attemptTimeoutMs);
      }

      if (pageResponse.ok) {
        // Verify final URL domain after redirects
        const finalUrl = pageResponse.url || url;
        if (finalUrl !== url) {
          try {
            if (!isOfficialDomain(new URL(finalUrl).hostname, domain)) {
              console.warn(`[Phase 1] Redirect landed on different domain: ${sanitizeForLog(finalUrl)} (expected ${domain})`);
              failedUrls.set(url, 302);
              continue;
            }
          } catch {}
        }

        // Phase 1.1 Refinement #5: Check for PDF early
        const contentType = pageResponse.headers.get('content-type') || '';
        if (contentType.toLowerCase().includes('application/pdf')) {
          console.log(`[Phase 1] ✓ Found PDF policy: ${sanitizeForLog(url)}`);
          return {
            content: '',
            url: finalUrl,
            discoveredUrls: attemptedUrls,
            policy_type: 'pdf',
            attemptTimeouts,
            bestScore: 30,
            failedUrls,
            policy_source: 'direct_fetch',
          };
        }
        
        const html = await pageResponse.text();

        // Soft-404 detection: reject pages returning 200 but showing "not found" content
        if (isSoft404(html)) {
          console.warn(`[Phase 1] Soft-404 detected: ${sanitizeForLog(url)}`);
          failedUrls.set(url, 404);
          continue;
        }
        
        // If this is the homepage or a generic page, extract and score privacy links
        if (url.includes(domain) && !url.match(/privacy|legal|terms|dsar|data-request/i)) {
          console.log(`[Phase 1] Analyzing page for privacy links: ${sanitizeForLog(url)}`);
          const scoredLinks = extractAndScorePrivacyLinks(html, domain, url);
          
          if (scoredLinks.length > 0) {
            console.log(`[Phase 1] Found ${scoredLinks.length} scored privacy links:`);
            scoredLinks.slice(0, 5).forEach(link => {
              console.log(`  - [Score: ${link.score}] ${sanitizeForLog(link.url)} (${link.linkText})`);
            });
            
            // Try top 5 scored links
            for (const link of scoredLinks.slice(0, 5)) {
              if (!budgetOk()) break;
              
              // Phase 1.1 Refinement #4 & #5: Quick validate with PDF detection
              const validation = await smartValidateUrl(link.url);
              if (!validation.valid) {
                console.log(`[Phase 1] Skipping invalid URL (${validation.status}): ${sanitizeForLog(link.url)}`);
                failedUrls.set(link.url, validation.status || 0);
                continue;
              }
              
              // Phase 1.1 Refinement #5: Handle PDF policies
              if (validation.isPDF) {
                console.log(`[Phase 1] ✓ Found PDF policy via link discovery: ${sanitizeForLog(link.url)}`);
                return {
                  content: '',
                  url: validation.finalUrl || link.url,
                  discoveredUrls: scoredLinks.slice(0, 10).map(l => l.url),
                  policy_type: 'pdf',
                  attemptTimeouts,
                  bestScore: 30,
                  failedUrls,
                  policy_source: `footer_link`,
                };
              }
              
              console.log(`[Phase 1] Trying validated URL: ${sanitizeForLog(link.url)}`);
              const result = await trySimpleFetch([link.url], domain, attemptTimeoutMs, earlyStopScore);
              if (result) {
                result.discoveredUrls = scoredLinks.slice(0, 10).map(l => l.url);
                if (!result.policy_source) result.policy_source = `${link.location}_link`;
                return result;
              }
            }
          } else {
            console.log(`[Phase 1] No privacy-related links found in HTML`);
          }
        }
        
        // Strip HTML for AI processing — use smart content window
        const strippedText = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&[a-z]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const content = extractSmartContentWindow(strippedText, 10000);
        
        // Check content quality and verify it's actually privacy policy content
        if (content.length > 200) {
          // Phase 1.1: Use enhanced privacy policy detection
          const policyCheck = isPrivacyPolicy(html, url);
          
          console.log(`[Phase 1] Privacy detection for ${sanitizeForLog(url)}:`);
          console.log(`  Score: ${policyCheck.score}/100`);
          console.log(`  Is Policy: ${policyCheck.isPolicy}`);
          console.log(`  Reasons: ${policyCheck.reasons.join(', ')}`);
          
          if (policyCheck.isPolicy) {
            console.log(`[Phase 1] ✓ Successfully fetched privacy content from: ${sanitizeForLog(url)} (${content.length} chars, score: ${policyCheck.score})`);
            
            // Track best result for early stopping
            if (policyCheck.score > bestScore) {
              bestScore = policyCheck.score;
              bestResult = { content, url, discoveredUrls: attemptedUrls, policy_source: 'direct_fetch' };
              
              // Early stop if score is high enough
              if (policyCheck.score >= earlyStopScore) {
                console.log(`[Guardrail] Early stop — score ${policyCheck.score} >= ${earlyStopScore}`);
                return { ...bestResult, attemptTimeouts, bestScore, failedUrls };
              }
            }
          } else {
            console.warn(`[Phase 1] Content doesn't appear to be a privacy policy: ${sanitizeForLog(url)} (score: ${policyCheck.score})`);
            
            // If score is borderline (20-29), still consider it but continue searching
            if (policyCheck.score >= 20 && policyCheck.score > bestScore) {
              console.log(`[Phase 1] ⚠️  Borderline score, will consider it: ${sanitizeForLog(url)}`);
              bestScore = policyCheck.score;
              bestResult = { content, url, discoveredUrls: attemptedUrls, policy_source: 'direct_fetch' };
            }
          }
        } else {
          // Check if this looks like a JS-rendered page that needs Browserless
          const needsJS = html.includes('<div id="root">') || 
                          html.includes('ng-app') || 
                          html.includes('data-react-root') ||
                          html.includes('__NEXT_DATA__') ||
                          html.includes('window.Shopify') ||
                          html.match(/<div[^>]+class="[^"]*react[^"]*"/i) ||
                          html.match(/<div[^>]+class="[^"]*vue[^"]*"/i);
          
          if (needsJS && content.length < 500) {
            console.log(`[Phase 1] Page appears to need JavaScript (${content.length} chars): ${sanitizeForLog(url)}`);
            console.log(`[Phase 1] Will attempt Browserless fallback for this domain`);
            // Mark this URL as needing JS - will trigger Phase 2 (Browserless)
            failedUrls.set(url, 999); // Special code to indicate JS needed
          } else {
            console.warn(`[Phase 1] Content too short from ${sanitizeForLog(url)} (${content.length} chars)`);
          }
        }
      } else {
        console.warn(`[Phase 1] HTTP ${pageResponse.status}: ${sanitizeForLog(url)}`);
        failedUrls.set(url, pageResponse.status);
      }
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      // Track attempt timeouts
      if (errorMsg.includes('attempt_timeout')) {
        attemptTimeouts++;
        console.warn(`[Guardrail] Attempt timeout for ${sanitizeForLog(url)}`);
      } else {
        console.warn(`[Phase 1] Error fetching ${sanitizeForLog(url)}: ${errorMsg}`);
      }
      
      failedUrls.set(url, 0);
    }
  }
  
  // Log failed URLs summary
  if (failedUrls.size > 0) {
    console.log(`[Phase 1] Failed URLs summary:`, Object.fromEntries(
      Array.from(failedUrls.entries()).map(([url, status]) => [sanitizeForLog(url), status])
    ));
  }
  
  // Return best result found, if any
  if (bestResult) {
    console.log(`[Phase 1] Returning best result with score ${bestScore}`);
    return { ...bestResult, attemptTimeouts, bestScore, failedUrls };
  }
  
  return null;
}

// Remove duplicate withAttemptTimeout declaration

// Phase 2: Browserless.io fallback for JavaScript-heavy sites
async function tryBrowserlessFetch(urlsToTry: string[], browserlessApiKey: string, domain?: string): Promise<{ content: string; url: string } | null> {
  console.log('[Phase 2] Falling back to Browserless.io for JavaScript rendering...');
  
  for (const url of urlsToTry) {
    console.log(`[Phase 2] Trying Browserless: ${url}`);
    
    try {
      // Try the newer /content endpoint first, fall back to /scrape
      const endpoints = [
        'https://production-sfo.browserless.io/content',
        'https://chrome.browserless.io/content',
      ];
      
      let lastError = '';
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}?token=${browserlessApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              url: url,
              waitForTimeout: 3000,
              gotoOptions: {
                waitUntil: 'networkidle2',
                timeout: 15000,
              },
              rejectResourceTypes: ['image', 'media', 'font'],
            }),
            signal: AbortSignal.timeout(20000)
          });

          if (response.ok) {
            const html = await response.text();
            
            // Try link extraction from Browserless HTML too (it has rendered JS)
            if (domain && html.length > 500) {
              const scoredLinks = extractAndScorePrivacyLinks(html, domain, url);
              if (scoredLinks.length > 0 && scoredLinks[0].score >= 25) {
                console.log(`[Phase 2] Found privacy links in Browserless HTML, trying top link: ${scoredLinks[0].url}`);
                // Try fetching the discovered privacy link directly 
                try {
                  const linkResp = await fetch(scoredLinks[0].url, {
                    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000),
                  });
                  if (linkResp.ok) {
                    const linkHtml = await linkResp.text();
                    if (!isSoft404(linkHtml)) {
                      const linkText = linkHtml
                        .replace(/<script[^>]*>.*?<\/script>/gis, '')
                        .replace(/<style[^>]*>.*?<\/style>/gis, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                      const linkContent = extractSmartContentWindow(linkText, 10000);
                      if (linkContent.length > 200) {
                        console.log(`[Phase 2] ✓ Fetched privacy page via Browserless link discovery: ${scoredLinks[0].url}`);
                        return { content: linkContent, url: scoredLinks[0].url };
                      }
                    }
                  }
                } catch {}
              }
            }
            
            // Strip HTML for AI processing — use smart content window
            const strippedText = html
              .replace(/<script[^>]*>.*?<\/script>/gis, '')
              .replace(/<style[^>]*>.*?<\/style>/gis, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            const content = extractSmartContentWindow(strippedText, 10000);
            
            if (content.length > 200) {
              if (isSoft404(html)) {
                console.warn(`[Phase 2] Soft-404 detected via Browserless: ${url}`);
                break; // Try next URL, not next endpoint
              }
              console.log(`[Phase 2] Successfully fetched via Browserless: ${url} (${content.length} chars)`);
              return { content, url };
            }
          } else {
            lastError = `${endpoint} returned ${response.status}`;
            console.warn(`[Phase 2] Browserless endpoint failed for ${url}: ${response.status} (${endpoint})`);
            // Try next endpoint
            continue;
          }
          break; // If we got here, the endpoint worked (even if content was short)
        } catch (endpointError) {
          lastError = endpointError instanceof Error ? endpointError.message : String(endpointError);
          console.warn(`[Phase 2] Browserless endpoint error (${endpoint}):`, lastError);
          continue; // Try next endpoint
        }
      }
      
      if (lastError) {
        console.warn(`[Phase 2] All Browserless endpoints failed for ${url}: ${lastError}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Phase 2] Browserless error for ${url}:`, errorMsg);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Declare variables outside try block for access in catch/finally
  let service_id: string | null = null;
  let user: any = null;
  let urlsToTry: string[] = [];
  let supabase: any = null;
  const startTime = Date.now();
  let metricsEmitted = false; // guard: only emit once

  // ── Unified metrics object — mutated during run, inserted in finally ──
  const metrics: Record<string, any> = {
    domain: '',
    success: false,
    method_used: 't1' as string,
    cache_hit: false,
    time_ms: 0,
    urls_considered: 0,
    urls_fetched: 0,
    urls_considered_top5: 0,
    hit_in_top5: false,
    probe_used: null as null | string,
    llm_calls: 0,
    input_tokens: null as null | number,
    output_tokens: null as null | number,
    model_used: null as null | string,
    browserless_used: false,
    error_code: null as null | string,
    confidence: null as null | string,
    policy_type: null as null | string,
    score: null as null | number,
    lang: null as null | string,
    vendor: null as null | string,
    prefill_supported: null as null | boolean,
    attempt_timeouts: 0,
    build_sha: Deno.env.get('GITHUB_SHA') ?? null,
    build_ver: Deno.env.get('APP_VERSION') ?? 'dev',
    // Phase 2.1: Structured provenance metadata
    status_map: null as null | Record<string, any>,
  };

  // Counted fetch wrapper — tracks actual HTTP requests
  let realFetchCount = 0;
  const countedFetch = (url: string, init?: RequestInit) => {
    realFetchCount++;
    return fetch(url, init);
  };

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authorization header');
    }

    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      throw new Error('Authentication failed');
    }
    user = { id: claimsData.claims.sub as string } as any;

    const requestBody = await req.json();
    service_id = requestBody.service_id;
    const privacy_url = requestBody.privacy_url;

    if (!service_id) {
      throw new Error('service_id is required');
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    // Check if domain is quarantined
    const quarantined = await isQuarantined(supabase, service.domain);
    if (quarantined) {
      console.log(`[Quarantine] Domain ${service.domain} is quarantined, skipping`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Domain temporarily quarantined due to repeated issues',
        error_code: 'QUARANTINED',
        error_type: 'bot_protection',
        suggested_action: 'try_again_later'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 });
    }

    console.log(`=== Discovering privacy contacts for: ${service.name} (${service.domain}) ===`);

    // ── Cross-user cache: reuse contacts by normalized apex domain ──
    const CACHE_TTL_DAYS = 90;
    const cacheMinDate = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const apexDomain = normalizeHost(service.domain);

    metrics.domain = service.domain;

    // Look up by DOMAIN (apex-normalized) for cross-service reuse, not just service_id
    const { data: cachedContacts } = await supabase
      .from('privacy_contacts')
      .select('*, service_catalog!inner(domain)')
      .in('confidence', ['high', 'medium'])
      .gte('updated_at', cacheMinDate)
      .order('created_at', { ascending: false })
      .limit(10);

    // Filter to same apex domain
    const domainMatches = (cachedContacts || []).filter((c: any) => {
      const cd = c.service_catalog?.domain;
      return cd && normalizeHost(cd) === apexDomain;
    });

    if (domainMatches.length > 0) {
      // Filter out PDF-only results — those aren't actionable contacts
      const isPdfUrl = (url: string) => {
        try { return new URL(url).pathname.toLowerCase().endsWith('.pdf'); } catch { return false; }
      };
      const actionableContacts = domainMatches.filter((c: any) => {
        if (c.contact_type === 'form' && isPdfUrl(c.value)) return false;
        return true;
      });

      if (actionableContacts.length > 0) {
        console.log(`[Cache] ✓ Reusing ${actionableContacts.length} existing contacts for ${apexDomain} (within ${CACHE_TTL_DAYS}d TTL)`);

        metrics.success = true;
        metrics.method_used = 'cache';
        metrics.cache_hit = true;
        metrics.confidence = actionableContacts[0].confidence;
        metrics.time_ms = Date.now() - startTime;
        metricsEmitted = true; // will be emitted in finally

        return new Response(JSON.stringify({
          success: true,
          service: service.name,
          contacts_found: actionableContacts.length,
          contacts: actionableContacts,
          method_used: 'cache',
          cache_hit: true,
          confidence: actionableContacts[0].confidence,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      } else {
        console.log(`[Cache] Only PDF-based contacts cached — proceeding with fresh discovery`);
      }
    }

    // ── Curated fallback: use hardcoded contacts for domains that always block automated discovery ──
    const curatedContacts = CURATED_CONTACTS[apexDomain];
    if (curatedContacts && curatedContacts.length > 0) {
      console.log(`[Curated] ✓ Found ${curatedContacts.length} curated contacts for ${apexDomain}`);

      // Check for existing contacts to avoid duplicates
      const { data: existingCurated } = await supabase
        .from('privacy_contacts')
        .select('contact_type, value')
        .eq('service_id', service_id);

      const existingCuratedSet = new Set(
        (existingCurated || []).map((c: any) => `${c.contact_type}:${c.value.toLowerCase()}`)
      );

      const curatedToInsert = curatedContacts
        .filter(c => !existingCuratedSet.has(`${c.contact_type}:${c.value.toLowerCase()}`))
        .map(c => ({
          service_id: service_id,
          contact_type: c.contact_type,
          value: c.value,
          confidence: c.confidence,
          reasoning: c.reasoning,
          verified: false,
          added_by: 'curated',
          source_url: `https://${apexDomain}`,
        }));

      if (curatedToInsert.length > 0) {
        await supabase.from('privacy_contacts').insert(curatedToInsert);
        console.log(`[Curated] Inserted ${curatedToInsert.length} new curated contacts`);
      }

      // Return the curated contacts (including any previously existing ones)
      const allCuratedResult = curatedContacts.map(c => ({
        ...c,
        service_id: service_id,
        verified: false,
        added_by: 'curated',
        source_url: `https://${apexDomain}`,
      }));

      metrics.success = true;
      metrics.method_used = 'curated';
      metrics.cache_hit = false;
      metrics.confidence = 'high';
      metrics.time_ms = Date.now() - startTime;
      metricsEmitted = true;

      return new Response(JSON.stringify({
        success: true,
        service: service.name,
        contacts_found: allCuratedResult.length,
        contacts: allCuratedResult,
        method_used: 'curated',
        cache_hit: false,
        confidence: 'high',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Phase 1.2/1.3: Try probes first (security.txt, robots.txt, sitemap with cache)
    let securityTxtContact: { type: string; contact: string; url: string } | null = null;
    let sitemapUrls: string[] = [];
    let cacheHit = false;
    
    if (ENABLE_SECURITY_TXT) {
      console.log('[Probe] Security.txt enabled, checking...');
      securityTxtContact = await probeSecurityTxt(service.domain);
      if (securityTxtContact) {
        console.log(`[Probe] ✓ Found security.txt contact: ${securityTxtContact.contact}`);
      }
    }
    
    // robots.txt probe: discover additional sitemap locations
    let robotsSitemapUrls: string[] = [];
    try {
      robotsSitemapUrls = await probeRobotsTxtShared(service.domain);
      if (robotsSitemapUrls.length > 0) {
        console.log(`[Probe] ✓ robots.txt found ${robotsSitemapUrls.length} sitemap URLs`);
      }
    } catch (e) {
      console.warn('[Probe] robots.txt probe failed:', e);
    }
    
    if (ENABLE_SITEMAP) {
      console.log('[Probe] Sitemap enabled, checking...');
      
      // Phase 1.3: Try cache first
      if (CACHE_SITEMAP) {
        const cached = await getSitemapCache(supabase, service.domain);
        if (cached.cacheHit && cached.urls) {
          sitemapUrls = cached.urls;
          cacheHit = true;
          console.log(`[Probe] ✓ Sitemap cache HIT: ${sitemapUrls.length} URLs`);
        }
      }
      
      // Fetch if not cached — try standard path + any robots.txt-discovered sitemaps
      if (!sitemapUrls.length) {
        sitemapUrls = await probeSitemap(service.domain);
        
        // Also try sitemaps discovered from robots.txt
        if (sitemapUrls.length === 0 && robotsSitemapUrls.length > 0) {
          console.log(`[Probe] Trying ${robotsSitemapUrls.length} sitemaps from robots.txt...`);
          for (const smUrl of robotsSitemapUrls.slice(0, 3)) {
            try {
              // Fetch the actual sitemap URL directly (not just the domain)
              const urls = await probeSitemapUrlShared(smUrl);
              sitemapUrls.push(...urls);
            } catch {}
          }
        }
        
        if (sitemapUrls.length > 0) {
          console.log(`[Probe] ✓ Found ${sitemapUrls.length} privacy URLs in sitemap`);
          
          if (CACHE_SITEMAP) {
            await setSitemapCache(supabase, service.domain, sitemapUrls);
            console.log(`[Probe] Cached sitemap results for ${service.domain}`);
          }
        }
      }
    }

    // Set probe_used early so it's populated even on error paths
    metrics.probe_used = securityTxtContact ? 'security_txt' : (sitemapUrls.length > 0 ? 'sitemap' : (robotsSitemapUrls.length > 0 ? 'robots_txt' : 'none'));

    // Build URL list with tiered approach: Tier 1 (high-probability) + Tier 2 (lazy, only if Tier 1 fails)
    const d = service.domain;
    
    // Tier 1: High-probability paths (5-7 paths, no www duplication — dedupe later)
    const tier1 = [
      ...sitemapUrls.slice(0, 3),              // Sitemap-discovered (highest signal)
      service.privacy_form_url,                 // Explicit from catalog
      `https://www.${d}`,                       // Homepage (for link extraction)
      `https://${d}`,                           // Homepage non-www
      `https://${d}/privacy`,                   // Most common path
      `https://${d}/privacy-policy`,            // Second most common
      `https://${d}/legal/privacy`,             // Legal section
      `https://${d}/privacy-notice`,            // Common in EU
      `https://${d}/privacy-center`,            // Common for large companies
    ].filter(Boolean) as string[];
    
    // Tier 2: Lazy paths (only tried if Tier 1 yields nothing)
    const tier2 = [
      `https://${d}/.well-known/privacy-policy.txt`,
      `https://${d}/privacypolicy`,
      `https://${d}/legal/privacy-policy`,
      `https://${d}/legal`,
      `https://${d}/ccpa`,
      `https://${d}/gdpr`,
      `https://${d}/privacy-rights`,
      `https://${d}/your-privacy-rights`,
      `https://${d}/help/privacy`,
      `https://${d}/support/privacy`,
      `https://${d}/about/privacy`,
      `https://${d}/policies/privacy`,
      `https://${d}/policies/privacy-policy`,
      `https://${d}/trust/privacy`,
      `https://${d}/en/privacy-policy`,
      `https://${d}/en/privacy`,
      `https://${d}/info/privacy`,
      `https://${d}/us/privacy`,
      `https://${d}/company/privacy`,
      `https://${d}/security/privacy`,
    ];

    // Deduplicate www/non-www upfront
    const dedupeUrls = (urls: string[]): string[] => {
      const seen = new Set<string>();
      return urls.filter(u => {
        const key = urlKey(u);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    
    const candidateUrls = privacy_url 
      ? [privacy_url]
      : dedupeUrls([...tier1, ...tier2]);
    
    // Phase 1.3: Language detection — reuse homepage HTML to avoid double-fetch
    let langDetected = 'en';
    let cachedHomepageHtml: string | null = null;
    
    if (DETECT_LANG && candidateUrls.length > 0) {
      try {
        const homeUrl = `https://${service.domain}`;
        const homeResponse = await countedFetch(homeUrl, {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' },
          redirect: 'follow',
          signal: AbortSignal.timeout(5000)
        });
        if (homeResponse.ok) {
          cachedHomepageHtml = await homeResponse.text();
          const guess = detectLanguage(cachedHomepageHtml, cachedHomepageHtml.slice(0, 10000));
          if (guess) {
            langDetected = guess.lang;
            console.log(`[Lang] Detected: ${langDetected} (confidence: ${guess.confidence.toFixed(2)})`);
          }
        }
      } catch (e) {
        console.warn('[Lang] Detection failed, using default (en):', e);
      }
    }
    
    // Store top 5 for precision@5 metric, ranked by locale
    const rankedCandidates = DETECT_LANG ? rankByLocale(langDetected, candidateUrls.map(url => ({ url }))) : candidateUrls.map(url => ({ url }));
    const top5Candidates = rankedCandidates.slice(0, 5).map(c => c.url);
    urlsToTry = rankedCandidates.map(c => c.url);

    console.log(`Prepared ${urlsToTry.length} URLs to try (top 5 for metrics: ${top5Candidates.length})`);
    if (DETECT_LANG) {
      console.log(`[Lang] Top 5 ranked by locale (${langDetected}):`, top5Candidates.slice(0, 3).map(sanitizeForLog));
    }

    // Phase 1: Try simple fetch with enhanced URL discovery and tail guardrails
    let result = await trySimpleFetch(urlsToTry, service.domain, ATTEMPT_TIMEOUT_MS, EARLY_STOP_CONFIDENCE, cachedHomepageHtml);
    let methodUsed = 'simple_fetch';
    const attemptTimeouts = result?.attemptTimeouts ?? 0;
    // Count Phase 1 fetches from attempted URLs (1 fetch per attempted URL, minus cached homepage)
    if (result?.discoveredUrls) {
      realFetchCount += result.discoveredUrls.length;
    }
    
    console.log(`[Guardrails] Attempt timeouts: ${attemptTimeouts}, Best score: ${result?.bestScore ?? 'N/A'}`);
    
    // Phase 2: Smart Browserless fallback - only when needed
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    const domainHint = getDomainHint(service.domain);
    
    // Identify URLs that need JavaScript (marked with 999 code)
    const jsNeededUrls = urlsToTry.filter(url => result?.failedUrls?.get(url) === 999);
    
    // Check if ALL Phase 1 URLs failed with network errors (status 0) — domain is blocking
    const failedUrlEntries = result?.failedUrls ? Array.from(result.failedUrls.entries()) : [];
    const networkErrorCount = failedUrlEntries.filter(([_, status]) => status === 0).length;
    const totalAttempted = failedUrlEntries.length;
    const allNetworkErrors = totalAttempted > 5 && networkErrorCount / totalAttempted >= 0.8;
    
    // Global elapsed time check — don't start Browserless if we're already past 45s
    const elapsedMs = Date.now() - startTime;
    const GLOBAL_BUDGET_MS = 50000; // 50s max for entire function
    const globalBudgetExceeded = elapsedMs > GLOBAL_BUDGET_MS;
    
    if (allNetworkErrors) {
      console.warn(`[Phase 2] Skipping Browserless — ${networkErrorCount}/${totalAttempted} URLs had network errors (domain blocks all requests)`);
    }
    if (globalBudgetExceeded) {
      console.warn(`[Phase 2] Skipping Browserless — global budget exceeded (${elapsedMs}ms > ${GLOBAL_BUDGET_MS}ms)`);
    }
    
    // Decide if we should use Browserless
    const shouldUseBrowserless = (
      (!result?.content || jsNeededUrls.length > 0 || domainHint?.requires_js) && 
      browserlessApiKey &&
      !allNetworkErrors &&
      !globalBudgetExceeded
    );
    
    if (shouldUseBrowserless) {
      // Prioritize JS-needed URLs, limit to top 3 for cost control
      const urlsForBrowserless = jsNeededUrls.length > 0 
        ? jsNeededUrls.slice(0, 3)
        : urlsToTry.slice(0, 3);
      
      // Log what triggered Browserless for cost monitoring (structured for easy parsing)
      const triggers = [];
      if (jsNeededUrls.length > 0) triggers.push(`${jsNeededUrls.length} JS-needed URLs`);
      if (domainHint?.requires_js) triggers.push('domain requires_js hint');
      if (!result?.content) triggers.push('no Phase 1 result');
      
      console.log(JSON.stringify({
        type: "browserless_invocation",
        urlsCount: urlsForBrowserless.length,
        triggers,
        domain: service.domain,
        timestamp: new Date().toISOString(),
      }));
      
      const browserlessResult = await tryBrowserlessFetch(urlsForBrowserless, browserlessApiKey, service.domain);
      realFetchCount += urlsForBrowserless.length; // Each browserless URL = 1 fetch
      
      if (browserlessResult) {
        result = {
          ...browserlessResult,
          attemptTimeouts: result?.attemptTimeouts || 0,
          bestScore: 50,
          failedUrls: result?.failedUrls || new Map()
        };
        methodUsed = 'browserless';
      }
    }

    // If both phases failed, return error
    if (!result || !result.content) {
      throw new Error(`Unable to find privacy policy. Tried ${urlsToTry.length} URL(s) with both simple and JavaScript rendering. Please provide a direct URL to the privacy policy.`);
    }

    const { content: privacyContent, url: successUrl, policy_type } = result;

    // Phase 2.1: Classify policy_source if not already set by trySimpleFetch
    const classifyPolicySource = (url: string, fallbackSource?: string): string => {
      if (fallbackSource && fallbackSource !== 'direct_fetch') return fallbackSource;
      if (privacy_url && url === privacy_url) return 'user_provided';
      if (service.privacy_form_url && url === service.privacy_form_url) return 'catalog';
      if (sitemapUrls.some(su => urlKey(su) === urlKey(url))) return 'sitemap';
      const urlPath = new URL(url).pathname;
      // Tier 1 paths
      const t1Paths = ['/privacy', '/privacy-policy', '/legal/privacy', '/privacy-notice', '/privacy-center'];
      if (t1Paths.some(p => urlPath === p || urlPath === p + '/')) return 'tier1_guess';
      return 'tier2_guess';
    };
    const policySource = methodUsed === 'browserless' ? 'browserless' : classifyPolicySource(successUrl, result.policy_source);

    // Policy URL validator: reject junk even if "discovered"
    let validatorResult = 'accepted';
    let validatorSignalsCount: number | null = null;
    if (policy_type !== 'pdf') {
      const policyValidation = validatePolicyUrl(successUrl, service.domain, privacyContent);
      if (!policyValidation.valid) {
        validatorResult = policyValidation.reason || 'rejected';
        console.warn(`[Policy Validator] Rejected ${sanitizeForLog(successUrl)}: ${policyValidation.reason}`);
        throw new Error(`Unable to find privacy policy. Discovered URL was rejected: ${policyValidation.reason}. Please provide a direct URL.`);
      }
      console.log(`[Policy Validator] ✓ Accepted ${sanitizeForLog(successUrl)} (source: ${policySource})`);
    }

    // Phase 1.2: Detect vendor and calculate confidence (with feature flags)
    let vendorInfo: VendorDetection | null = null;
    if (ENABLE_VENDOR_DET) {
      vendorInfo = detectVendorShared({ url: successUrl, html: privacyContent });
      if (vendorInfo.platform_detected !== 'none') {
        console.log(`[Vendor] Detected: ${vendorInfo.platform_detected} (prefill: ${vendorInfo.pre_fill_supported})`);
      }
    }
    
    // Phase 1.3: Get vendor form hints
    const vendorHint = vendorInfo && vendorInfo.platform_detected !== 'none'
      ? getVendorHint(vendorInfo.platform_detected)
      : getVendorHint('unknown');
    
    const policyScore = policy_type === 'pdf' ? 30 : 50; // PDFs get medium score by default
    const confidence = toConfidence(policyScore, successUrl, vendorInfo?.platform_detected);
    
    // Calculate precision@5
    const p5 = precisionAt5(top5Candidates, successUrl);
    console.log(`[Metrics] Precision@5: hit=${p5.hit_in_top5}, considered=${p5.urls_considered_top5}`);

// Phase 1.1 Refinement #5: Handle PDF policies — do NOT store as contact
    if (policy_type === 'pdf') {
      console.log(`[PDF Policy] Found PDF policy at ${sanitizeForLog(successUrl)}`);
      console.log(`[PDF Policy] Returning for manual review — NOT storing as contact`);

      // Update unified metrics for PDF
      metrics.success = true;
      metrics.policy_type = 'pdf';
      metrics.score = policyScore;
      metrics.confidence = confidence;
      metrics.lang = langDetected;
      metrics.cache_hit = cacheHit;
      metrics.vendor = vendorInfo?.platform_detected ?? null;
      metrics.prefill_supported = vendorInfo?.pre_fill_supported ?? null;
      metrics.attempt_timeouts = attemptTimeouts;
      metrics.probe_used = securityTxtContact ? 'security_txt' : (sitemapUrls.length > 0 ? 'sitemap' : null);
      metrics.browserless_used = methodUsed === 'browserless';
      metrics.urls_considered = urlsToTry.length;
      metrics.urls_considered_top5 = top5Candidates.length;
      metrics.hit_in_top5 = p5.hit_in_top5;
      metrics.urls_fetched = realFetchCount;
      metrics.status_map = { policy_source: policySource, validator_result: 'skipped_pdf' };
      metricsEmitted = true;

      return new Response(
        JSON.stringify({
          success: true,
          service: service.name,
          contacts_found: 0,
          privacy_policy_found: true,
          privacy_policy_url: successUrl,
          requires_manual_review: true,
          contacts: [],
          method_used: 't1',
          policy_type: 'pdf',
          confidence,
          score: policyScore,
          url: successUrl,
          lang_detected: langDetected,
          cache_hit: cacheHit,
          reasons: ['PDF policy found — manual review required'],
          vendor_form_hints: {
            platform: vendorHint.platform,
            prefill_supported: vendorHint.prefill_supported,
            selectors: vendorHint.selectors,
            request_types: vendorHint.request_types ?? []
          },
          message: 'Privacy policy is a PDF. Please review manually for contact information.',
          discovery_metadata: { policy_source: policySource, validator_result: 'skipped_pdf' },
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Call OpenAI with tool calling for structured extraction
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant specializing in analyzing privacy policies to extract contact information for data deletion requests (GDPR, CCPA, etc.).

Analyze the following privacy policy and extract ALL contact methods that could be used for data deletion requests.

CRITICAL RULES - NEVER VIOLATE:
1. Do NOT return the company homepage (e.g., "www.domain.com", "domain.com", "https://domain.com/")
2. Do NOT return the privacy policy URL itself - you're analyzing it, not returning it as a contact
3. Do NOT return generic "Contact Us" pages unless they explicitly have a privacy/deletion form
4. Only return email addresses that:
   - Match the service domain (${service.domain}) OR
   - Are explicitly privacy-related (privacy@, dpo@, gdpr@, ccpa@, data-protection@)
5. Only return forms that have specific paths for privacy/deletion (not just /contact or /contact-us)
6. If confidence is "low", do not return the contact at all

EXAMPLES OF WHAT NOT TO RETURN:
❌ www.example.com (homepage)
❌ https://example.com/privacy-policy (the policy itself)
❌ https://example.com/contact (generic contact page)
❌ info@example.com (unless explicitly mentioned for privacy requests)

EXAMPLES OF WHAT TO RETURN:
✅ privacy@example.com
✅ dpo@example.com
✅ https://example.com/privacy/delete-data
✅ https://example.com/dsar-request

For each contact method found, provide:
1. contact_type: 'email', 'form', or 'phone' (NO 'other' type)
2. value: The actual contact (email address, form URL, phone number)
3. confidence: 'high' or 'medium' (do NOT return 'low' confidence contacts)
4. reasoning: Specific explanation citing where in the policy this was found

Guidelines:
- Email addresses with 'privacy', 'dpo', 'data-protection', 'gdpr' terms are HIGH confidence
- Forms with specific privacy/deletion paths are HIGH confidence
- Generic support emails that are explicitly mentioned for privacy are MEDIUM confidence
- Phone numbers should be international format if possible

Extract ONLY actionable contact methods for data deletion requests.`;

    const userPrompt = `Company: ${service.name}
Domain: ${service.domain}
Privacy Policy Content:
${privacyContent}

Extract all relevant contact methods for data deletion requests.`;

    console.log('Calling OpenAI for contact extraction...');

    // Helper: validate form URLs with soft-404 and privacy-relevance check
    async function validateContactUrl(url: string): Promise<boolean> {
      try {
        const response = await countedFetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
          redirect: 'follow',
          headers: { 'User-Agent': USER_AGENT, 'Range': 'bytes=0-30000' },
        });
        if (!response.ok && response.status !== 206) return false;

        const ct = response.headers.get('content-type') || '';
        if (ct.includes('text/html')) {
          const html = await response.text();
          const t = html.slice(0, 30000).toLowerCase();

          // Soft-404 detection
          if (t.includes('page not found') || t.includes('404 error') || t.includes('not found</h1>')) {
            console.log(`[URL Validation] Soft-404 detected: ${url}`);
            return false;
          }
          // Privacy relevance gate
          const privacyRelevant = /(privacy|personal information|data subject|gdpr|ccpa|delete|request your data|your rights)/i.test(t);
          if (!privacyRelevant) {
            console.log(`[URL Validation] Not privacy-relevant content: ${url}`);
            return false;
          }
        }
        return true;
      } catch (error) {
        console.log(`[URL Validation] Failed for ${url}:`, error);
        return false;
      }
    }

    const response = await countedFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'save_privacy_contacts',
              description: 'Save discovered privacy contact methods',
              parameters: {
                type: 'object',
                properties: {
                  contacts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                         contact_type: {
                          type: 'string',
                          enum: ['email', 'form', 'phone'],
                          description: 'Type of contact method'
                        },
                        value: {
                          type: 'string',
                          description: 'The actual contact value (email address, URL, phone number, etc.)'
                        },
                        confidence: {
                          type: 'string',
                          enum: ['high', 'medium'],
                          description: 'Confidence level — only return high or medium confidence contacts'
                        },
                        reasoning: {
                          type: 'string',
                          description: 'Explanation of why this contact was identified and confidence level'
                        }
                      },
                      required: ['contact_type', 'value', 'confidence', 'reasoning']
                    }
                  }
                },
                required: ['contacts']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'save_privacy_contacts' } },
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
    
    // Capture token usage for cost tracking
    const tokenUsage = aiResponse.usage || {};
    const inputTokens = tokenUsage.prompt_tokens || null;
    const outputTokens = tokenUsage.completion_tokens || null;
    console.log(`[Cost] OpenAI tokens: ${inputTokens} in / ${outputTokens} out (model: gpt-4o-mini)`);
    
    if (!toolCall) {
      throw new Error('No tool call response from AI');
    }

    const findings: { contacts: ContactFinding[] } = JSON.parse(toolCall.function.arguments);

    console.log(`Found ${findings.contacts.length} contact methods from AI`);

    // Filter out invalid contacts BEFORE storing
    const validContacts = findings.contacts.filter(contact => {
      // Rule 1: Reject low confidence
      if (contact.confidence === 'low') {
        console.log(`[Filter] Rejected low confidence: ${contact.value}`);
        return false;
      }
      
      // Rule 2: Reject homepage URLs (domain only, no path or just "/")
      if (contact.contact_type === 'form') {
        try {
          const url = new URL(contact.value.startsWith('http') ? contact.value : `https://${contact.value}`);
          const isHomepage = url.pathname === '/' || url.pathname === '';
          if (isHomepage) {
            console.log(`[Filter] Rejected homepage URL: ${contact.value}`);
            return false;
          }
          
          // Reject privacy policy URLs themselves
          if (url.pathname.match(/privacy[-_]?(policy|notice)/i) && !url.pathname.match(/delete|deletion|request|dsar/i)) {
            console.log(`[Filter] Rejected privacy policy URL: ${contact.value}`);
            return false;
          }
          
          // Reject generic contact pages without specific privacy paths
          if (url.pathname.match(/^\/contact[-_]?us?\/?$/i) && !url.pathname.match(/privacy|deletion|gdpr|ccpa|dsar/i)) {
            console.log(`[Filter] Rejected generic contact page: ${contact.value}`);
            return false;
          }
        } catch (e) {
          console.log(`[Filter] Invalid URL format: ${contact.value}`);
          return false;
        }
      }
      
      // Rule 3: Validate email format and domain
      if (contact.contact_type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.value)) {
          console.log(`[Filter] Invalid email format: ${contact.value}`);
          return false;
        }
        
        // Check if email domain matches service domain
        const emailDomain = contact.value.split('@')[1].toLowerCase();
        const serviceDomain = service.domain.toLowerCase().replace('www.', '');
        const isPrivacyEmail = ['privacy', 'dpo', 'gdpr', 'ccpa', 'data-protection'].some(prefix => 
          contact.value.toLowerCase().startsWith(prefix + '@')
        );
        
        if (!emailDomain.includes(serviceDomain) && !isPrivacyEmail) {
          console.log(`[Filter] Email domain mismatch: ${contact.value} vs ${serviceDomain}`);
          return false;
        }
      }
      
      return true;
    });

    console.log(`[Filter] ${findings.contacts.length} → ${validContacts.length} after filtering`);
    
    // If all contacts were filtered out, log this as a failure
    if (findings.contacts.length > 0 && validContacts.length === 0) {
      try {
        await supabase
          .from('contact_discovery_failures')
          .insert({
            service_id: service_id,
            user_id: user.id,
            failure_type: 'all_filtered',
            error_message: `AI found ${findings.contacts.length} contacts but all were filtered out as low quality`,
            urls_tried: urlsToTry,
          });
        console.log('[Failure Log] All contacts filtered - logged for review');
      } catch (logError) {
        console.error('[Failure Log] Failed to log filtering issue:', logError);
      }
    }

    // Validate URLs for form contacts — DISCARD invalid ones entirely (no hallucinated URLs)
    const urlValidatedContacts: typeof validContacts = [];
    for (const contact of validContacts) {
      if (contact.contact_type === 'form' && contact.value) {
        console.log(`[URL Validation] Checking form URL: ${contact.value}`);
        const isValid = await validateContactUrl(contact.value);
        
        if (!isValid) {
          console.warn(`[URL Validation] ❌ Discarding invalid form URL: ${contact.value}`);
          // Do NOT store — hallucinated URLs must never reach the DB
          continue;
        } else {
          console.log(`[URL Validation] ✓ Valid form URL: ${contact.value}`);
        }
      }
      urlValidatedContacts.push(contact);
    }
    
    // Replace validContacts with only URL-validated ones
    const finalContacts = urlValidatedContacts;

    // Check for existing contacts to avoid duplicates
    const { data: existingContacts } = await supabase
      .from('privacy_contacts')
      .select('contact_type, value')
      .eq('service_id', service_id);

    const existingSet = new Set(
      (existingContacts || []).map((c: any) => `${c.contact_type}:${c.value.toLowerCase()}`)
    );

    const contactsToInsert = finalContacts
      .filter(contact => {
        const key = `${contact.contact_type}:${contact.value.toLowerCase()}`;
        if (existingSet.has(key)) {
          console.log(`[Dedup] Skipping duplicate: ${contact.value}`);
          return false;
        }
        return true;
      })
      .map(contact => ({
        service_id: service_id,
        contact_type: contact.contact_type,
        value: contact.value,
        confidence: contact.confidence,
        reasoning: contact.reasoning,
        verified: false,
        added_by: 'ai',
        source_url: successUrl,
      }));

    const totalFoundBeforeDedup = finalContacts.length;
    console.log(`[Dedup] ${totalFoundBeforeDedup} → ${contactsToInsert.length} after deduplication`);

    // Store findings in database
    const { data: insertedContacts, error: insertError } = await supabase
      .from('privacy_contacts')
      .insert(contactsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting contacts:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully stored ${insertedContacts.length} privacy contacts`);

    // Calculate aggregate confidence and score
    const highCount = insertedContacts.filter((c: any) => c.confidence === 'high').length;
    const overallConfidence = toConfidence(policyScore, successUrl, vendorInfo?.platform_detected);
    
    // Update unified metrics for success
    metrics.success = true;
    metrics.policy_type = policy_type || 'html';
    metrics.score = policyScore;
    metrics.confidence = overallConfidence;
    metrics.lang = langDetected;
    metrics.cache_hit = cacheHit;
    metrics.vendor = vendorInfo?.platform_detected ?? null;
    metrics.prefill_supported = vendorInfo?.pre_fill_supported ?? null;
    metrics.attempt_timeouts = attemptTimeouts;
    metrics.probe_used = securityTxtContact ? 'security_txt' : (sitemapUrls.length > 0 ? 'sitemap' : null);
    metrics.llm_calls = 1;
    metrics.input_tokens = inputTokens;
    metrics.output_tokens = outputTokens;
    metrics.model_used = 'gpt-4o-mini';
    metrics.browserless_used = methodUsed === 'browserless';
    metrics.urls_considered = urlsToTry.length;
    metrics.urls_considered_top5 = top5Candidates.length;
    metrics.hit_in_top5 = p5.hit_in_top5;
    metrics.urls_fetched = realFetchCount;
    metrics.status_map = {
      policy_source: policySource,
      validator_result: validatorResult,
      has_strong_path: /\/(privacy|datenschutz|privacidad|confidentialite)([-_]?(policy|notice|statement))?\/?$/i.test(new URL(successUrl).pathname),
    };
    metricsEmitted = true;
    
    return new Response(
      JSON.stringify({
        success: true,
        service: service.name,
        contacts_found: insertedContacts.length,
        contacts_found_total: totalFoundBeforeDedup,
        already_known: totalFoundBeforeDedup - insertedContacts.length,
        contacts: insertedContacts,
        method_used: METHOD_USED,
        policy_type: policy_type || 'html',
        confidence: overallConfidence,
        score: policyScore,
        url: successUrl,
        lang_detected: langDetected,
        cache_hit: cacheHit,
        reasons: insertedContacts.map((c: any) => c.reasoning),
        precision_at_5: p5.hit_in_top5,
        ...(vendorInfo && vendorInfo.platform_detected !== 'none' && { 
          platform_detected: vendorInfo.platform_detected,
          pre_fill_supported: vendorInfo.pre_fill_supported,
          vendor_evidence: vendorInfo.evidence
        }),
        vendor_form_hints: {
          platform: vendorHint.platform,
          prefill_supported: vendorHint.prefill_supported,
          selectors: vendorHint.selectors,
          request_types: vendorHint.request_types ?? []
        },
        ...(securityTxtContact && {
          security_contact: securityTxtContact.contact
        }),
        // Phase 2.1: Provenance metadata for debugging
        discovery_metadata: {
          policy_source: policySource,
          validator_result: validatorResult,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in discover-privacy-contacts:', error);
    
    // Create structured error
    const structuredError: StructuredError = {
      error_code: 'DISCOVERY_FAILED',
      error_type: 'ai_error',
      message: error.message || 'Unknown error occurred',
      suggested_action: 'contact_support'
    };
    
    // Determine specific error type and action
    if (error.message?.includes('Unable to find privacy policy')) {
      structuredError.error_type = 'no_policy_found';
      structuredError.error_code = 'POLICY_NOT_FOUND';
      structuredError.suggested_action = 'provide_url';
      structuredError.message = 'Could not find privacy policy on the website. Please provide the direct URL to the privacy policy page.';
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('http2 error')) {
      structuredError.error_type = 'fetch_failed';
      structuredError.error_code = 'NETWORK_ERROR';
      structuredError.suggested_action = 'try_again_later';
      structuredError.message = 'Network error while fetching the page. The website may be down or blocking our requests.';
    } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
      structuredError.error_type = 'fetch_failed';
      structuredError.error_code = 'TIMEOUT';
      structuredError.suggested_action = 'try_again_later';
      structuredError.message = 'Request timed out. The website is taking too long to respond.';
    } else if (error.message?.includes('OpenAI')) {
      structuredError.error_type = 'ai_error';
      structuredError.error_code = 'AI_PROCESSING_ERROR';
      structuredError.suggested_action = 'try_again_later';
      structuredError.message = 'AI analysis failed. Please try again in a moment.';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      structuredError.error_type = 'bot_protection';
      structuredError.error_code = 'ACCESS_DENIED';
      structuredError.suggested_action = 'manual_entry';
      structuredError.message = 'Website is blocking automated access. Please manually find and enter the privacy contact information.';
      
      // Quarantine domain after repeated bot_protection failures
      if (supabase && service_id) {
        try {
          const { data: service } = await supabase
            .from('service_catalog')
            .select('domain')
            .eq('id', service_id)
            .single();
          
          if (service?.domain) {
            const { data: recentFailures } = await supabase
              .from('discovery_metrics')
              .select('id')
              .eq('domain', service.domain)
              .eq('error_code', 'ACCESS_DENIED')
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            
            if ((recentFailures?.length ?? 0) >= 2) {
              await addToQuarantine(supabase, service.domain, 'bot_protection', 24 * 60 * 60 * 1000, error.message);
              console.log(`[Quarantine] Added ${service.domain} to 24h quarantine after ${recentFailures?.length ?? 0} bot_protection failures`);
            }
          }
        } catch (qError) {
          console.error('[Quarantine] Failed to add to quarantine:', qError);
        }
      }
    } else if (error.message?.includes('404')) {
      structuredError.error_type = 'no_policy_found';
      structuredError.error_code = 'PAGE_NOT_FOUND';
      structuredError.suggested_action = 'provide_url';
      structuredError.message = 'The privacy policy page was not found (404). Please verify the URL and try again.';
    }
    
    // Log failure to database for admin review
    try {
      const failureData: any = {
        service_id: service_id,
        user_id: user?.id,
        failure_type: structuredError.error_type,
        error_message: structuredError.message,
        urls_tried: urlsToTry,
        error_code: structuredError.error_code,
        suggested_action: structuredError.suggested_action,
      };

      // Add HTTP status codes if available
      if (error.statusCodes) {
        failureData.http_status_codes = error.statusCodes;
      }

      if (supabase) {
        await supabase
          .from('contact_discovery_failures')
          .insert(failureData);
        
        console.log('[Failure Log] Structured error logged to admin dashboard');
      }
    } catch (logError) {
      console.error('[Failure Log] Failed to log error:', logError);
    }
    
    // Update unified metrics for failure
    metrics.error_code = structuredError.error_code;
    metrics.urls_considered = urlsToTry.length;
    metrics.urls_fetched = realFetchCount;
    metricsEmitted = true;
    
    // Phase 1.4: Enqueue to T2 on eligible failures (with quarantine check)
    const t2Domain = metrics.domain || ''; // Use actual domain, not service_id UUID
    if (ENABLE_T2 && structuredError.error_code && T2_RETRY_ON.has(structuredError.error_code) && t2Domain && supabase) {
      try {
        // Check if domain is quarantined before enqueuing
        const quarantined = await isQuarantined(supabase, t2Domain.toLowerCase());
        if (quarantined) {
          console.log(`[T2] Skipped (quarantined) → ${t2Domain}`);
        } else {
          const seedUrl = urlsToTry.length > 0 ? urlsToTry[0] : `https://${t2Domain}`;
          const requestId = crypto.randomUUID();
          await supabase.from('t2_retries').insert({
            domain: t2Domain.toLowerCase(),
            seed_url: seedUrl,
            reason: structuredError.error_code,
            status: 'queued',
            next_run_at: new Date(Date.now() + 60_000).toISOString(), // +1min backoff
            request_id: requestId,
          });
          console.log(`[T2][${requestId}] Queued → ${t2Domain} (${structuredError.error_code})`);
        }
      } catch (t2Error) {
        console.warn('[T2] Failed to enqueue:', t2Error);
      }
    }
    
    // Return appropriate status code
    const statusMap: Record<StructuredError['error_type'], number> = {
      no_policy_found: 404,
      fetch_failed: 503,
      bot_protection: 403,
      invalid_content: 422,
      ai_error: 500,
      validation_failed: 400
    };
    
    const status = statusMap[structuredError.error_type] || 500;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: structuredError.message,
        error_code: structuredError.error_code,
        error_type: structuredError.error_type,
        suggested_action: structuredError.suggested_action,
        details: {
          urls_attempted: urlsToTry.length,
          service_domain: metrics.domain || service_id || null
        }
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } finally {
    // ── Single metrics emit point — always runs ──
    if (metricsEmitted && supabase && !DISABLE_METRICS) {
      try {
        metrics.time_ms = Date.now() - startTime;
        metrics.urls_fetched = realFetchCount;
        // Ensure domain is set even on early failures
        if (!metrics.domain && service_id) metrics.domain = service_id;
        await supabase.from('discovery_metrics').insert(metrics);
        console.log(`[Metrics] ✓ Emitted: success=${metrics.success}, llm=${metrics.llm_calls}, tokens=${metrics.input_tokens}/${metrics.output_tokens}, fetches=${metrics.urls_fetched}, probe=${metrics.probe_used}`);
      } catch (metricsError) {
        console.error('[Metrics] Failed to emit:', metricsError);
      }
    }
  }
});
