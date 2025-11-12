// supabase/functions/_shared/probes.test.ts
// Unit tests for Phase 1.2 probe utilities

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { precisionAt5, toConfidence, detectVendorFromUrl, detectVendorFromHtml, sanitizeForLog } from './probes.ts';

Deno.test('precisionAt5 - hits when normalized path matches', () => {
  const top5 = [
    'https://www.example.com/privacy',
    'https://example.com/legal/privacy-policy/',
  ];
  const finalUrl = 'https://example.com/legal/privacy-policy';
  const r = precisionAt5(top5, finalUrl);
  assertEquals(r.hit_in_top5, true);
  assertEquals(r.urls_considered_top5, 2);
});

Deno.test('precisionAt5 - miss when path differs', () => {
  const top5 = [
    'https://example.com/about',
    'https://example.com/contact',
  ];
  const finalUrl = 'https://example.com/privacy';
  const r = precisionAt5(top5, finalUrl);
  assertEquals(r.hit_in_top5, false);
  assertEquals(r.urls_considered_top5, 2);
});

Deno.test('toConfidence - vendor detected → high', () => {
  assertEquals(toConfidence(0, 'https://x.com', 'onetrust'), 'high');
  assertEquals(toConfidence(0, 'https://x.com', 'securiti'), 'high');
});

Deno.test('toConfidence - path heuristic → high', () => {
  assertEquals(toConfidence(0, 'https://example.com/privacy'), 'high');
  assertEquals(toConfidence(0, 'https://example.com/privacy-policy/'), 'high');
  assertEquals(toConfidence(0, 'https://example.com/privacy-policy'), 'high');
});

Deno.test('toConfidence - score thresholds', () => {
  assertEquals(toConfidence(40, 'https://x.com'), 'high');
  assertEquals(toConfidence(25, 'https://x.com'), 'medium');
  assertEquals(toConfidence(24, 'https://x.com'), 'low');
  assertEquals(toConfidence(10, 'https://x.com'), 'low');
});

Deno.test('detectVendorFromUrl - OneTrust fingerprint', () => {
  const result = detectVendorFromUrl('https://cdn.cookielaw.org/consent/otprivacy.js');
  assertEquals(result.platform_detected, 'onetrust');
  assertEquals(result.pre_fill_supported, false);
});

Deno.test('detectVendorFromUrl - Securiti fingerprint', () => {
  const result = detectVendorFromUrl('https://privacy-central.securiti.ai/tenant/foo');
  assertEquals(result.platform_detected, 'securiti');
  assertEquals(result.pre_fill_supported, true);
});

Deno.test('detectVendorFromUrl - TrustArc fingerprint', () => {
  const result = detectVendorFromUrl('https://consent.trustarc.com/v2/trustarc.js');
  assertEquals(result.platform_detected, 'trustarc');
  assertEquals(result.pre_fill_supported, false);
});

Deno.test('detectVendorFromUrl - no match → none', () => {
  const result = detectVendorFromUrl('https://example.com/privacy');
  assertEquals(result.platform_detected, 'none');
  assertEquals(result.pre_fill_supported, false);
});

Deno.test('detectVendorFromHtml - TrustArc in script', () => {
  const html = '<script src="https://consent.trustarc.com/v2/trustarc.js"></script>';
  const result = detectVendorFromHtml(html);
  assertEquals(result.platform_detected, 'trustarc');
  assertEquals(result.pre_fill_supported, false);
});

Deno.test('detectVendorFromHtml - Transcend in HTML', () => {
  const html = '<div data-transcend-consent="true">...</div>';
  const result = detectVendorFromHtml(html);
  assertEquals(result.platform_detected, 'transcend');
  assertEquals(result.pre_fill_supported, true);
});

Deno.test('detectVendorFromHtml - no match → none', () => {
  const html = '<div>Just normal HTML</div>';
  const result = detectVendorFromHtml(html);
  assertEquals(result.platform_detected, 'none');
  assertEquals(result.pre_fill_supported, false);
});

Deno.test('sanitizeForLog - redacts sensitive params', () => {
  const url = 'https://example.com/page?email=user@test.com&token=secret123&normal=value';
  const sanitized = sanitizeForLog(url);
  assertEquals(sanitized.includes('user@test.com'), false);
  assertEquals(sanitized.includes('secret123'), false);
  assertEquals(sanitized.includes('REDACTED'), true);
  assertEquals(sanitized.includes('normal=value'), true);
});

Deno.test('sanitizeForLog - removes hash', () => {
  const url = 'https://example.com/page#section';
  const sanitized = sanitizeForLog(url);
  assertEquals(sanitized.includes('#section'), false);
});
