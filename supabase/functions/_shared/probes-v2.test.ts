// Tests for Phase 2 probe enhancements: smart content window, policy URL validator, isOfficialDomain, isSoft404

import { extractSmartContentWindow, validatePolicyUrl, isOfficialDomain, isSoft404 } from './probes.ts';
import { extractJSON, parseAIContactsResponse, validateAIContacts } from './discovery_ai.ts';

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

Deno.test('extractSmartContentWindow: deduplicates overlapping keyword regions', () => {
  const padding = 'z '.repeat(3000);
  // Two keywords very close together — should merge into one region, not duplicate
  const middle = 'Contact our data protection officer at dpo@example.com to exercise your rights under GDPR.';
  const text = padding + middle + padding;
  const result = extractSmartContentWindow(text, 10000);
  // Count how many times the middle section appears (should be 1, not 2+)
  const count = result.split('data protection officer').length - 1;
  if (count > 1) throw new Error(`Expected 1 occurrence of keyword region, got ${count} (dedup failed)`);
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

Deno.test('isOfficialDomain: same registrable domain (subdomain)', () => {
  if (!isOfficialDomain('blog.example.com', 'example.com')) throw new Error('Subdomain of target should match');
});

Deno.test('isOfficialDomain: co.uk TLD not confused as same domain', () => {
  // evil.co.uk should NOT match example.co.uk — they share "co.uk" but are different registrable domains
  if (isOfficialDomain('evil.co.uk', 'example.co.uk')) throw new Error('Different .co.uk domains should not match');
});

Deno.test('isOfficialDomain: legitimate subdomain of co.uk domain', () => {
  if (!isOfficialDomain('privacy.example.co.uk', 'example.co.uk')) throw new Error('Subdomain of .co.uk domain should match');
});

Deno.test('isOfficialDomain: terms subdomain removed from allowlist', () => {
  // terms.example.com should still match because it's a subdomain of example.com
  // but the allowlist no longer specifically includes 'terms'
  // It still matches via the endsWith check, which is correct
  if (!isOfficialDomain('terms.example.com', 'example.com')) throw new Error('Subdomain should still match via endsWith');
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

Deno.test('validatePolicyUrl: strong URL path + 1 signal = valid', () => {
  // Only 1 English signal, but URL path is /privacy → should accept
  const content = 'This page describes our approach to personal data.';
  const r = validatePolicyUrl('https://example.com/privacy', 'example.com', content);
  if (!r.valid) throw new Error(`Strong URL + 1 signal should be valid, got: ${r.reason}`);
});

Deno.test('validatePolicyUrl: German privacy page accepted', () => {
  const content = 'Datenschutzerklärung. Wir verarbeiten personenbezogene Daten gemäß DSGVO.';
  const r = validatePolicyUrl('https://example.de/datenschutz', 'example.de', content);
  if (!r.valid) throw new Error(`German privacy page should be valid, got: ${r.reason}`);
});

Deno.test('validatePolicyUrl: Spanish privacy page accepted', () => {
  const content = 'Política de privacidad. Tratamos sus datos personales conforme a la ley.';
  const r = validatePolicyUrl('https://example.es/privacidad', 'example.es', content);
  if (!r.valid) throw new Error(`Spanish privacy page should be valid, got: ${r.reason}`);
});

Deno.test('validatePolicyUrl: non-privacy URL needs ≥2 signals', () => {
  // URL is /legal (not a strong privacy path), only 1 signal
  const content = 'This page contains information about personal data.';
  const r = validatePolicyUrl('https://example.com/legal', 'example.com', content);
  if (r.valid) throw new Error('Non-privacy URL with only 1 signal should be rejected');
});

// ── isSoft404 tests ──

Deno.test('isSoft404: detects "page not found" in short content', () => {
  const html = '<h1>Page Not Found</h1><p>The page you requested does not exist.</p>';
  if (!isSoft404(html)) throw new Error('Should detect soft-404');
});

Deno.test('isSoft404: does not flag real privacy policy', () => {
  const content = 'Privacy Policy. We collect personal data including your name, email address. ' +
    'You have the right to request deletion of your data under GDPR. ' +
    'Contact our Data Protection Officer at dpo@example.com. ' +
    'x '.repeat(2000); // Make it long enough
  if (isSoft404(content)) throw new Error('Should not flag real privacy policy as soft-404');
});

Deno.test('isSoft404: detects "404 error" with short content', () => {
  const html = '<div>404 error - this page doesn\'t exist</div>';
  if (!isSoft404(html)) throw new Error('Should detect 404 error signal');
});

Deno.test('isSoft404: does not flag long page with incidental "not found" mention', () => {
  // A real policy that happens to mention "not found" in context
  const content = 'Privacy Policy. If the requested data is not found in our systems, we will notify you. ' +
    'We collect personal data as described in our GDPR compliance documentation. ' +
    'x '.repeat(3000);
  if (isSoft404(content)) throw new Error('Should not flag incidental mention in long content');
});

Deno.test('isSoft404: detects multiple signals even in long content', () => {
  const content = '<h1>Page Not Found</h1><p>Oops! We couldn\'t find this page.</p>' + 'x '.repeat(3000);
  if (!isSoft404(content)) throw new Error('Should detect 2+ signals regardless of length');
});

Deno.test('extractJSON: strips markdown fences and parses payload', () => {
  const payload = extractJSON('```json\n{"contacts":[{"contact_type":"email","value":"privacy@example.com","confidence":"high","reasoning":"privacy@example.com appears in the policy"}]}\n```');
  if (!Array.isArray(payload.contacts) || payload.contacts.length !== 1) throw new Error('Expected one parsed contact');
});

Deno.test('parseAIContactsResponse: rejects truncated responses', () => {
  let threw = false;
  try {
    parseAIContactsResponse({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] }, 1000);
  } catch (error) {
    threw = String((error as Error).message).includes('truncated');
  }
  if (!threw) throw new Error('Expected truncation detection to throw');
});

Deno.test('validateAIContacts: rejects hallucinated contact not present in source', () => {
  const source = 'Privacy Policy. Contact us at privacy@example.com for deletion requests.';
  const result = validateAIContacts([
    { contact_type: 'email', value: 'fake@example.com', confidence: 'high', reasoning: 'Found fake@example.com in policy' },
    { contact_type: 'email', value: 'privacy@example.com', confidence: 'high', reasoning: 'privacy@example.com appears in the policy' },
  ], source);

  if (result.validContacts.length !== 1) throw new Error('Expected only one valid contact');
  if (result.rejectedContacts.length !== 1) throw new Error('Expected one rejected contact');
});
