// supabase/functions/_shared/probes.ts
// Phase 1.2: Probe utilities for privacy contact discovery

// -------------------- Config --------------------
const int = (v?: string, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
export const PROBE_TIMEOUT_MS = Math.min(15000, Math.max(1500, int(Deno.env.get('PROBE_TIMEOUT_MS'), 4000)));
export const SITEMAP_MAX_LOCS = Math.min(2000, Math.max(25, int(Deno.env.get('SITEMAP_MAX_LOCS'), 200))); // default 200
export const SITEMAP_MAX_BYTES = Math.min(10_000_000, Math.max(200_000, int(Deno.env.get('SITEMAP_MAX_BYTES'), 5_000_000))); // default 5MB

// -------------------- Types --------------------
export type ProbeContact =
  | { type: 'security.txt'; contact: string; url: string }
  | { type: 'sitemap'; url: string };

export interface VendorDetection {
  platform_detected: 'onetrust' | 'securiti' | 'trustarc' | 'cookiebot' | 'transcend' | 'ketch' | 'osano' | 'cookieyes' | 'didomi' | 'termly' | 'none';
  pre_fill_supported: boolean;
  evidence?: string; // matched url/snippet
}

// -------------------- Utilities --------------------
const UA =
  'Mozilla/5.0 (compatible; PrivacyDiscoveryBot/1.2; +https://example.com/bot)';

const PRIVACY_RE = /(privacy|privacy-policy|privacy_notice|data-?protection|gdpr|ccpa|dsar|data-request)/i;

export function sanitizeForLog(u: string): string {
  try {
    const x = new URL(u);
    x.hash = '';
    // redaction
    for (const k of x.searchParams.keys()) {
      if (['email', 'e', 'user', 'token', 'auth', 'code'].includes(k.toLowerCase())) {
        x.searchParams.set(k, 'REDACTED');
      }
    }
    return x.toString();
  } catch {
    return u;
  }
}

async function gunzipToText(ab: ArrayBuffer): Promise<string> {
  // Guard: size limit
  if (ab.byteLength > SITEMAP_MAX_BYTES) {
    throw new Error(`Sitemap exceeds ${SITEMAP_MAX_BYTES} bytes`);
  }
  
  // Prefer Web Streams DecompressionStream if available (Deno/Node 20+)
  try {
    // @ts-ignore
    if (typeof DecompressionStream !== 'undefined') {
      // @ts-ignore
      const ds = new DecompressionStream('gzip');
      const s = new Response(new Blob([ab]).stream().pipeThrough(ds));
      const text = await s.text();
      return normalizeXml(text);
    }
  } catch {}
  // Ultimate fallback: try to decode as text (will be gibberish if gzipped)
  const text = new TextDecoder('utf-8').decode(ab);
  return normalizeXml(text);
}

function normalizeXml(xml: string): string {
  return xml.trim();
}

// Robust fetch with timeout + headers
async function fetchText(url: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<Response> {
  return await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
}

// -------------------- Probes --------------------

// RFC 9116: /.well-known/security.txt
export async function probeSecurityTxt(domain: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<ProbeContact | null> {
  const url = `https://${domain}/.well-known/security.txt`;
  try {
    const r = await fetchText(url, timeoutMs);
    if (!r.ok) return null;
    const t = await r.text();
    const m = t.match(/^\s*Contact:\s*(.+)$/im);
    if (m) {
      return { type: 'security.txt', contact: m[1].trim(), url };
    }
  } catch {}
  return null;
}

// Parse a sitemap XML string and extract privacy-relevant <loc> URLs
function extractPrivacyLocsFromXml(xml: string, out: Set<string>) {
  const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map((m) => m[1])
    .slice(0, SITEMAP_MAX_LOCS);
  
  for (const loc of locs) {
    if (PRIVACY_RE.test(loc)) {
      out.add(sanitizeForLog(loc));
      if (out.size >= SITEMAP_MAX_LOCS) break;
    }
  }
}

// Fetch and parse a specific sitemap URL (for robots.txt-discovered sitemaps)
export async function probeSitemapUrl(sitemapUrl: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<string[]> {
  const out = new Set<string>();
  try {
    const r = await fetch(sitemapUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': UA, 'Accept': 'application/xml,text/xml,*/*' },
    });
    if (!r.ok) return [];

    let xml = '';
    if (sitemapUrl.endsWith('.gz')) {
      const ab = await r.arrayBuffer();
      xml = await gunzipToText(ab);
    } else {
      const text = await r.text();
      xml = normalizeXml(text);
    }

    extractPrivacyLocsFromXml(xml, out);
  } catch {}
  return [...out];
}

// sitemap.xml (and gzip variant). Returns privacy-ish URLs (deduped, sanitized).
export async function probeSitemap(domain: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<string[]> {
  const out = new Set<string>();

  async function tryPath(path: string) {
    const url = `https://${domain}${path}`;
    try {
      const r = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'User-Agent': UA, 'Accept': 'application/xml,text/xml,*/*' },
      });
      if (!r.ok) return;

      let xml = '';
      if (path.endsWith('.gz')) {
        const ab = await r.arrayBuffer();
        xml = await gunzipToText(ab);
      } else {
        const text = await r.text();
        xml = normalizeXml(text);
      }

      extractPrivacyLocsFromXml(xml, out);
    } catch {}
  }

  await tryPath('/sitemap.xml');
  if (out.size === 0) await tryPath('/sitemap.xml.gz');

  return [...out];
}

// -------------------- Vendor Fingerprinting --------------------
// Evidence can be URL or small HTML snippet.
const VENDORS = [
  { key: 'onetrust',   re: /onetrust\.com|otprivacy|optanon|cookieconsent(?:.*?)one ?trust/i, prefill: false },
  { key: 'securiti',   re: /securiti\.(ai|app)|privacy-central\.securiti/i,                     prefill: true  },
  { key: 'trustarc',   re: /trustarc\.com|consent\.trustarc|privacycentral\.trustarc/i,        prefill: false },
  { key: 'cookiebot',  re: /cookiebot\.(com|consentcdn)|consent\.cookiebot/i,                   prefill: false },
  { key: 'transcend',  re: /transcend\.(io|build)|privacy\.(transcend)|data-transcend/i,        prefill: true  },
  { key: 'ketch',      re: /ketch\.com|global-privacy-control|app\.ketch\./i,                  prefill: true  },
  { key: 'osano',      re: /osano\.com|cmp\.osano/i,                                           prefill: false },
  { key: 'cookieyes',  re: /cookieyes\.com|consent\.cookieyes/i,                                prefill: false },
  { key: 'didomi',     re: /didomi\.io|consent\.didomi/i,                                      prefill: false },
  { key: 'termly',     re: /termly\.io|consent-manager\.termly/i,                               prefill: false },
] as const;

export function detectVendorFromUrl(url: string): VendorDetection {
  for (const v of VENDORS) {
    if (v.re.test(url)) {
      const evidence = sanitizeForLog(url).slice(0, 180);
      return { platform_detected: v.key, pre_fill_supported: v.prefill, evidence } as VendorDetection;
    }
  }
  return { platform_detected: 'none', pre_fill_supported: false };
}

export function detectVendorFromHtml(html: string): VendorDetection {
  for (const v of VENDORS) {
    const m = html.match(v.re);
    if (m) {
      const evidence = sanitizeForLog(m[0] || '').slice(0, 180);
      return { platform_detected: v.key, pre_fill_supported: v.prefill, evidence } as VendorDetection;
    }
  }
  return { platform_detected: 'none', pre_fill_supported: false };
}

// Unified detector (check URL first, then HTML)
export function detectVendor(input: { url?: string; html?: string }): VendorDetection {
  if (input.url) {
    const u = detectVendorFromUrl(input.url);
    if (u.platform_detected !== 'none') return u;
  }
  if (input.html) {
    return detectVendorFromHtml(input.html);
  }
  return { platform_detected: 'none', pre_fill_supported: false };
}

// -------------------- robots.txt Sitemap Discovery --------------------
export async function probeRobotsTxt(domain: string, timeoutMs = PROBE_TIMEOUT_MS): Promise<string[]> {
  const url = `https://${domain}/robots.txt`;
  try {
    const r = await fetchText(url, timeoutMs);
    if (!r.ok) return [];
    const t = await r.text();
    // Extract Sitemap: directives (case-insensitive per spec)
    const sitemaps: string[] = [];
    for (const line of t.split('\n')) {
      const m = line.match(/^\s*Sitemap:\s*(.+)/i);
      if (m) {
        const sitemapUrl = m[1].trim();
        if (sitemapUrl.startsWith('http')) {
          sitemaps.push(sitemapUrl);
        }
      }
    }
    return sitemaps;
  } catch {}
  return [];
}

// -------------------- Smart Content Window --------------------
// Replaces naive 8KB truncation with targeted extraction:
// First 3KB + keyword-matched sections (deduplicated) + last 2KB
const CONTACT_KEYWORDS = [
  'contact us', 'data protection officer', 'dpo@', 'privacy@', 'gdpr@', 'ccpa@',
  'exercise your rights', 'deletion request', 'data subject', 'your rights',
  'opt out', 'opt-out', 'delete my', 'remove my', 'erasure',
  'data-protection@', 'mailto:', 'email us', 'write to us',
];

export function extractSmartContentWindow(text: string, maxSize = 10000): string {
  if (text.length <= maxSize) return text;

  const first = text.slice(0, 3000);
  const last = text.slice(-2000);
  const budget = maxSize - first.length - last.length; // ~5KB for keyword sections

  // Collect (start, end) ranges around keywords, then merge overlapping intervals
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];

  for (const kw of CONTACT_KEYWORDS) {
    let idx = lower.indexOf(kw);
    while (idx !== -1) {
      const start = Math.max(0, idx - 300);
      const end = Math.min(text.length, idx + kw.length + 500);
      ranges.push([start, end]);
      idx = lower.indexOf(kw, idx + kw.length + 500);
    }
  }

  // Sort by start, then merge overlapping intervals
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    if (merged.length > 0 && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }

  // Extract merged chunks within budget
  const sections: string[] = [];
  let used = 0;
  for (const [s, e] of merged) {
    const chunk = text.slice(s, e);
    if (used + chunk.length > budget) break;
    sections.push(chunk);
    used += chunk.length;
  }

  return [first, '...', ...sections, '...', last].join('\n');
}

// -------------------- Soft-404 Detection --------------------
const SOFT_404_SIGNALS = [
  'page not found', '404 error', 'not found</h1>', 'page doesn\'t exist',
  'page does not exist', 'no longer available', 'page has been removed',
  'we couldn\'t find', 'we could not find', 'this page isn\'t available',
  'nothing here', 'oops!', 'error 404', 'page you requested',
  'page you are looking for', 'sorry, we can\'t find',
];

export function isSoft404(content: string): boolean {
  const lower = content.slice(0, 5000).toLowerCase();
  const matchCount = SOFT_404_SIGNALS.filter(s => lower.includes(s)).length;
  // Require at least 1 signal AND short content (real policies are long)
  if (matchCount >= 1 && content.length < 3000) return true;
  // Or 2+ signals regardless of length (strong indicator)
  if (matchCount >= 2) return true;
  return false;
}

// -------------------- Policy URL Validator --------------------
// Validates discovered URLs: domain must match, content must have privacy signals
const PRIVACY_SIGNALS = [
  'privacy policy', 'personal data', 'gdpr', 'ccpa', 'data protection',
  'controller', 'data protection officer', 'your rights', 'data subject',
  'personal information', 'we collect', 'delete your', 'erasure',
];

const OFFICIAL_SUBDOMAINS = ['privacy', 'legal', 'help', 'support', 'policies', 'explore', 'my', 'account', 'app', 'www2', 'secure', 'trust', 'info', 'docs'];

// Extract the eTLD+1 (effective top-level domain + 1) for comparison.
// Handles common multi-part TLDs (.co.uk, .com.au, etc.)
function getBaseDomain(hostname: string): string {
  const parts = hostname.toLowerCase().replace(/^www\./i, '').split('.');
  // Handle two-part TLDs like co.uk, com.au, co.jp, org.uk, etc.
  const multiPartTLDs = ['co.uk', 'com.au', 'co.jp', 'co.nz', 'com.br', 'co.kr', 'co.in', 'org.uk', 'com.mx', 'com.sg', 'co.za'];
  const lastTwo = parts.slice(-2).join('.');
  if (multiPartTLDs.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  // Standard: last 2 parts
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
}

export function isOfficialDomain(candidateHost: string, targetDomain: string): boolean {
  const normCandidate = candidateHost.replace(/^www\./i, '').toLowerCase();
  const normTarget = targetDomain.replace(/^www\./i, '').toLowerCase();

  // Exact match
  if (normCandidate === normTarget) return true;

  // Allow known official subdomains (e.g., privacy.google.com for google.com)
  for (const sub of OFFICIAL_SUBDOMAINS) {
    if (normCandidate === `${sub}.${normTarget}`) return true;
  }

  // Strict subdomain: candidate must end with `.${normTarget}`
  if (normCandidate.endsWith(`.${normTarget}`)) return true;

  // eTLD+1 match: allow redirects between sibling domains with same base
  // e.g., explore.zoom.us → zoom.us, policies.google.com → google.com
  const candidateBase = getBaseDomain(normCandidate);
  const targetBase = getBaseDomain(normTarget);
  if (candidateBase === targetBase) return true;

  return false;
}

// Privacy-like URL path patterns (multilingual)
const STRONG_PRIVACY_PATHS = /\/(privacy|datenschutz|privacidad|confidentialite|informativa-privacy|privacidade|プライバシー)([-_]?(policy|notice|statement|richtlinie|politica|politique))?\/?$/i;

// Multilingual privacy signals for content validation
const I18N_PRIVACY_SIGNALS = [
  // German
  'datenschutzerkl\u00e4rung', 'personenbezogene daten', 'datenschutzbeauftragter', 'ihre rechte', 'dsgvo',
  // Spanish
  'pol\u00edtica de privacidad', 'datos personales', 'protección de datos', 'sus derechos',
  // French
  'politique de confidentialit\u00e9', 'donn\u00e9es personnelles', 'protection des donn\u00e9es', 'vos droits',
  // Italian
  'informativa sulla privacy', 'dati personali', 'protezione dei dati', 'diritti',
  // Portuguese
  'pol\u00edtica de privacidade', 'dados pessoais', 'proteção de dados',
];

export function validatePolicyUrl(url: string, targetDomain: string, content?: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    // Domain check
    if (!isOfficialDomain(parsed.hostname, targetDomain)) {
      return { valid: false, reason: `Domain mismatch: ${parsed.hostname} vs ${targetDomain}` };
    }

    // Reject PDFs unless explicitly supported
    if (parsed.pathname.toLowerCase().endsWith('.pdf')) {
      return { valid: false, reason: 'PDF policy — requires manual review' };
    }

    // Strong privacy path bypasses content signals entirely (e.g. /privacy, /datenschutz).
    // Telemetry showed valid policies on JS-rendered sites (DoorDash, Reddit) were rejected
    // because the static HTML lacked text signals despite the URL being canonical.
    const hasStrongPath = STRONG_PRIVACY_PATHS.test(parsed.pathname);
    if (hasStrongPath) {
      return { valid: true };
    }

    // If we have content, check for privacy signals
    if (content) {
      const lower = content.toLowerCase();

      // Count English signals
      const enSignalCount = PRIVACY_SIGNALS.filter(s => lower.includes(s)).length;
      // Count i18n signals
      const i18nSignalCount = I18N_PRIVACY_SIGNALS.filter(s => lower.includes(s)).length;
      const totalSignals = enSignalCount + i18nSignalCount;

      // Without strong path, require ≥2 signals
      if (totalSignals < 2) {
        return { valid: false, reason: `Only ${totalSignals} privacy signals (need ≥2)` };
      }

      // Reject "terms" mislabeled as privacy
      const hasTermsTitle = /terms\s+(of\s+)?(service|use)/i.test(lower.slice(0, 2000));
      const hasPrivacyTitle = /privacy\s*(policy|notice|statement)/i.test(lower.slice(0, 2000));
      if (hasTermsTitle && !hasPrivacyTitle) {
        return { valid: false, reason: 'Appears to be Terms of Service, not Privacy Policy' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL' };
  }
}

// -------------------- Precision@5 & Confidence --------------------
export function precisionAt5(candidatesTop5: string[], finalUrl: string) {
  // finalUrl may redirect → compare by hostname+path (normalized)
  const key = (u: string) => {
    try {
      const x = new URL(u);
      const host = x.hostname.replace(/^www\./i, '').toLowerCase();
      const path = x.pathname.replace(/\/+$/,'');
      return `${host}${path}`;
    } catch {
      return u;
    }
  };
  const top5Set = new Set(candidatesTop5.map(key));
  return {
    urls_considered_top5: candidatesTop5.length,
    hit_in_top5: top5Set.has(key(finalUrl)),
  };
}

export function toConfidence(score: number, url: string, vendor?: string): 'high' | 'medium' | 'low' {
  try {
    if (vendor && vendor !== 'none') return 'high';
    const p = new URL(url).pathname.toLowerCase();
    if (/\/privacy(-policy)?\/?$/.test(p)) return 'high';
  } catch {}
  if (score >= 40) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}
