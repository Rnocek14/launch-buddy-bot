// Phase 1.3: Unit tests for tail latency guardrails

Deno.test('attempt timeout wrapper', async () => {
  const slow = new Promise(res => setTimeout(() => res('ok'), 9999));
  const race = Promise.race([
    slow, 
    new Promise((_, rej) => setTimeout(() => rej(new Error('attempt_timeout')), 50))
  ]);
  
  let threw = false;
  try {
    await race;
  } catch (e) {
    threw = String((e as Error).message).includes('attempt_timeout');
  }
  
  if (!threw) throw new Error('expected attempt_timeout');
});

Deno.test('slow-domain overrides clamp', () => {
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

  const m = parseOverrides('airbnb.com:40000,booking.com:35000');
  if ((m.get('airbnb.com') ?? 0) !== 40000) throw new Error('override parse failed');
  if ((m.get('booking.com') ?? 0) !== 35000) throw new Error('override parse failed');
  if (m.size !== 2) throw new Error('expected 2 overrides');
});

Deno.test('slow-domain overrides clamp bounds', () => {
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

  const m = parseOverrides('slow.com:99999,fast.com:1000');
  // 99999 should clamp to 60000
  if ((m.get('slow.com') ?? 0) !== 60000) throw new Error('expected upper clamp to 60000');
  // 1000 should clamp to 3000
  if ((m.get('fast.com') ?? 0) !== 3000) throw new Error('expected lower clamp to 3000');
});
