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
        // Size guard applied in gunzipToText
        xml = await gunzipToText(ab);
      } else {
        const text = await r.text();
        xml = normalizeXml(text);
      }

      // Extract <loc>…</loc> quickly (no heavy XML deps) with cap
      const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
        .map((m) => m[1])
        .slice(0, SITEMAP_MAX_LOCS);
      
      for (const loc of locs) {
        if (PRIVACY_RE.test(loc)) {
          out.add(sanitizeForLog(loc));
          if (out.size >= SITEMAP_MAX_LOCS) break;
        }
      }
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
  { key: 'transcend',  re: /transcend\.(io|build)|privacy\.(transcend)/i,                       prefill: true  },
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
