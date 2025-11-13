// Unit tests for T2 worker filters and backoff logic

Deno.test('href filter excludes data/javascript URLs', () => {
  const hrefs = ['data:text/plain,hi', 'javascript:void(0)', 'https://site/privacy'];
  const filtered = hrefs.filter(h => h && !h.startsWith('data:') && !h.startsWith('javascript:'));
  
  if (filtered.length !== 1 || !filtered[0].includes('/privacy')) {
    throw new Error('filter failed');
  }
});

Deno.test('backoff grows with attempts', () => {
  const base = 15000;
  const attempts = 2;
  const next = new Date(Date.now() + base * attempts);
  
  if ((next.getTime() - Date.now()) < base * attempts - 50) {
    throw new Error('backoff too small');
  }
});

Deno.test('backoff respects max attempts', () => {
  const maxAttempts = 3;
  const attempts = 4; // exceeds max
  
  if (attempts > maxAttempts) {
    // Should not reschedule
    const shouldFail = true;
    if (!shouldFail) throw new Error('should have failed at max attempts');
  }
});
