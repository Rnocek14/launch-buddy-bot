import { getVendorHint } from './vendor_hints.ts';

Deno.test('vendor hints fallback to unknown', () => {
  const h = getVendorHint('nope');
  if (h.platform !== 'unknown') throw new Error('expected unknown');
  if (h.prefill_supported !== false) throw new Error('expected prefill_supported false');
});

Deno.test('vendor hints return correct platform', () => {
  const onetrust = getVendorHint('onetrust');
  if (onetrust.platform !== 'onetrust') throw new Error('expected onetrust');
  if (onetrust.prefill_supported !== false) throw new Error('onetrust should not support prefill');
  
  const securiti = getVendorHint('securiti');
  if (securiti.platform !== 'securiti') throw new Error('expected securiti');
  if (securiti.prefill_supported !== true) throw new Error('securiti should support prefill');
});

Deno.test('vendor hints include selectors', () => {
  const h = getVendorHint('onetrust');
  if (!h.selectors.email || h.selectors.email.length === 0) {
    throw new Error('expected email selectors for onetrust');
  }
  if (!h.selectors.submit || h.selectors.submit.length === 0) {
    throw new Error('expected submit selectors for onetrust');
  }
});
