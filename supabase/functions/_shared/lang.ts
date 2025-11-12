// Phase 1.3: Language detection and locale preference
export type LangGuess = { lang: string; confidence: number };

const META_RE = /<meta[^>]+(?:property|name)=["']og:locale["'][^>]+content=["']([^"']+)/i;
const HTML_LANG_RE = /<html[^>]+lang=["']([^"']+)/i;

// Fallback heuristic over first ~8–10KB body text
const COMMON: Record<string, RegExp> = {
  'en': /\b(privacy|policy|data|cookie|your|we)\b/gi,
  'es': /\b(privacidad|política|datos|cookies|sus|nosotros)\b/gi,
  'fr': /\b(confidentialité|politique|données|cookies|vos|nous)\b/gi,
  'de': /\b(datenschutz|richtlinie|daten|cookies|ihre|wir)\b/gi,
  'it': /\b(privacy|informativa|dati|cookie|vostri|noi)\b/gi,
};

export function detectLanguage(html: string, textSample: string = ''): LangGuess | null {
  // Try HTML lang attribute
  const m1 = HTML_LANG_RE.exec(html)?.[1];
  if (m1) return { lang: m1.toLowerCase(), confidence: 0.95 };

  // Try OG locale meta tag
  const m2 = META_RE.exec(html)?.[1];
  if (m2) return { lang: m2.toLowerCase().replace('_', '-'), confidence: 0.9 };

  // Fallback to heuristic matching
  const sample = (textSample || html).slice(0, 10000);
  let best: LangGuess | null = null;
  
  for (const [lang, re] of Object.entries(COMMON)) {
    const matches = sample.match(re);
    const hits = matches?.length ?? 0;
    if (hits > 0 && (!best || hits > best.confidence * 100)) {
      best = { lang, confidence: Math.min(0.8, hits / 10) };
    }
  }
  
  return best;
}

// Prefer locale-matching candidates when available
export function rankByLocale<T extends { url: string }>(lang: string | undefined, candidates: T[]): T[] {
  if (!lang) return candidates;
  
  const langCore = lang.toLowerCase().split(/[-_]/)[0];
  
  const score = (u: string) => {
    const p = new URL(u).pathname.toLowerCase();
    return [lang.toLowerCase(), langCore, `/intl/${langCore}/`, `/${langCore}/`, `-${langCore}/`]
      .some(tok => p.includes(tok)) ? 1 : 0;
  };
  
  return [...candidates].sort((a, b) => score(b.url) - score(a.url));
}
