import { describe, test, expect } from 'bun:test';
import { isBrokerDomain, noMatchStatus, parseSearchResponse } from '../supabase/functions/free-broker-check/searchPolicy';
import { GmailProvider } from '../supabase/functions/_shared/email-providers/gmail';

describe('public search evidence', () => {
  test('provider errors cannot become successful empty searches', () => {
    expect(() => parseSearchResponse({ error: 'Invalid API key' })).toThrow();
    expect(() => parseSearchResponse({})).toThrow();
    expect(parseSearchResponse({ organic_results: [] })).toEqual([]);
    expect(parseSearchResponse({ error: "Google hasn't returned any results for this query." })).toEqual([]);
  });
  test('failed or partial searches remain unknown', () => {
    expect(noMatchStatus(0, 2)).toBe('unknown');
    expect(noMatchStatus(1, 2)).toBe('unknown');
    expect(noMatchStatus(2, 2)).toBe('not_found');
  });
  test('broker domains must be exact or real subdomains', () => {
    expect(isBrokerDomain('https://www.whitepages.com/person', 'whitepages.com')).toBe(true);
    expect(isBrokerDomain('https://evilwhitepages.com/person', 'whitepages.com')).toBe(false);
    expect(isBrokerDomain('https://whitepages.com.evil.test/person', 'whitepages.com')).toBe(false);
  });
});

describe('metadata-only Gmail scans', () => {
  test('repeat scans omit q and filter by internal message date', async () => {
    const originalFetch = globalThis.fetch;
    const originalDeno = (globalThis as any).Deno;
    (globalThis as any).Deno = { env: { get: () => '' } };
    const urls: string[] = [];
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input); urls.push(url);
      if (url.includes('/messages?')) return Response.json({ messages: [{ id: 'old' }, { id: 'new' }] });
      return Response.json({ id: url.endsWith('/old') ? 'old' : 'new', internalDate: url.includes('/old?') ? '1000' : '3000', payload: { headers: [] } });
    }) as typeof fetch;
    try {
      const messages = await new GmailProvider().getMessages('test-token', { after: '1970-01-01T00:00:02Z', maxResults: 2 });
      expect(urls.every(url => !new URL(url).searchParams.has('q'))).toBe(true);
      expect(messages).toHaveLength(1);
    } finally { globalThis.fetch = originalFetch; (globalThis as any).Deno = originalDeno; }
  });
  test('metadata failures fail the scan instead of silently losing accounts', async () => {
    const originalFetch = globalThis.fetch;
    const originalDeno = (globalThis as any).Deno;
    (globalThis as any).Deno = { env: { get: () => '' } };
    globalThis.fetch = (async (input: string | URL | Request) => String(input).includes('/messages?')
      ? Response.json({ messages: [{ id: 'one' }] }) : new Response('Permission denied', { status: 403 })) as typeof fetch;
    try { await expect(new GmailProvider().getMessages('test-token', { maxResults: 1 })).rejects.toThrow('403'); }
    finally { globalThis.fetch = originalFetch; (globalThis as any).Deno = originalDeno; }
  });
});