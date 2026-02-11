// Tests for Phase 2 probe enhancements: smart content window, policy URL validator, isOfficialDomain

import { extractSmartContentWindow, validatePolicyUrl, isOfficialDomain } from './probes.ts';

Deno.test('extractSmartContentWindow: short text returned as-is', () => {
  const text = 'Hello world';
  const result = extractSmartContentWindow(text, 10000);
  if (result !== text) throw new Error('Expected unchanged text for short input');
});

Deno.test('extractSmartContentWindow: includes keyword sections from middle', () => {
  const padding = 'x '.repeat(3000); // 6000 chars
  const middle = 'You can exercise your rights by contacting our Data Protection Officer at dpo@example.com';
  const text = padding + middle + padding;
  const result = extractSmartContentWindow(text, 10000);
  if (!result.includes('dpo@example.com')) throw new Error('Expected keyword section to be extracted');
});

Deno.test('extractSmartContentWindow: includes last 2KB', () => {
  const padding = 'y '.repeat(6000);
  const ending = 'Contact privacy@example.com for any deletion requests end_marker';
  const text = padding + ending;
  const result = extractSmartContentWindow(text, 10000);
  if (!result.includes('end_marker')) throw new Error('Expected last 2KB to be included');
});

Deno.test('isOfficialDomain: same domain', () => {
  if (!isOfficialDomain('example.com', 'example.com')) throw new Error('Same domain should match');
});

Deno.test('isOfficialDomain: www prefix', () => {
  if (!isOfficialDomain('www.example.com', 'example.com')) throw new Error('www should match');
});

Deno.test('isOfficialDomain: official subdomain', () => {
  if (!isOfficialDomain('privacy.google.com', 'google.com')) throw new Error('privacy. subdomain should match');
  if (!isOfficialDomain('help.company.com', 'company.com')) throw new Error('help. subdomain should match');
});

Deno.test('isOfficialDomain: different domain rejected', () => {
  if (isOfficialDomain('evil.com', 'example.com')) throw new Error('Different domain should not match');
});

Deno.test('isOfficialDomain: same registrable domain', () => {
  if (!isOfficialDomain('blog.example.com', 'example.com')) throw new Error('Same registrable domain should match');
});

Deno.test('validatePolicyUrl: valid privacy policy', () => {
  const content = 'This is our Privacy Policy. We collect personal data under GDPR. Data protection officer contact.';
  const r = validatePolicyUrl('https://example.com/privacy', 'example.com', content);
  if (!r.valid) throw new Error(`Expected valid, got: ${r.reason}`);
});

Deno.test('validatePolicyUrl: rejects domain mismatch', () => {
  const r = validatePolicyUrl('https://evil.com/privacy', 'example.com');
  if (r.valid) throw new Error('Should reject domain mismatch');
});

Deno.test('validatePolicyUrl: rejects PDF', () => {
  const r = validatePolicyUrl('https://example.com/privacy.pdf', 'example.com');
  if (r.valid) throw new Error('Should reject PDF');
});

Deno.test('validatePolicyUrl: rejects terms-of-service mislabeled', () => {
  const content = 'Terms of Service agreement. You agree to these terms. We may collect some data.';
  const r = validatePolicyUrl('https://example.com/legal', 'example.com', content);
  if (r.valid) throw new Error('Should reject terms mislabeled as privacy');
});

Deno.test('validatePolicyUrl: rejects low-signal content', () => {
  const content = 'Welcome to our website. Buy amazing products. Shop now. Free shipping available.';
  const r = validatePolicyUrl('https://example.com/privacy', 'example.com', content);
  if (r.valid) throw new Error('Should reject content with no privacy signals');
});
