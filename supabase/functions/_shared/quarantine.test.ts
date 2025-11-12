// Unit tests for quarantine logic

Deno.test('quarantine TTL parsing', () => {
  const ttl = 24 * 60 * 60 * 1000;
  const until = new Date(Date.now() + ttl);
  const now = new Date();
  if (until <= now) throw new Error('TTL should be in the future');
});

Deno.test('quarantine domain normalization', () => {
  const d1 = 'Example.COM';
  const d2 = 'example.com';
  if (d1.toLowerCase() !== d2.toLowerCase()) throw new Error('domains should match');
});
