import { describe, test, expect } from 'bun:test';
import { deliveryAllowed, retryDecision, removalReportCounts, WORKER_BATCH_SIZE } from '../supabase/functions/_shared/removal-delivery';

describe('protected removal delivery', () => {
 test('Complete requires active permission', () => expect(deliveryAllowed('complete','active',false,'found',1,0)).toBe(false));
 test('revoked or cancelled subscriptions cannot send', () => expect(deliveryAllowed('complete','cancelled',true,'found',1,0)).toBe(false));
 test('Pro does not qualify for Complete removals', () => expect(deliveryAllowed('pro','active',true,'found',1,0)).toBe(false));
 test('completed attempt cannot send again', () => expect(deliveryAllowed('complete','active',true,'request_sent',1,1)).toBe(false));
 test('eligible Complete delivery proceeds', () => expect(deliveryAllowed('complete','active',true,'found',1,0)).toBe(true));
 test('three broker contacts maximum', () => expect(deliveryAllowed('complete','active',true,'waiting',4,3)).toBe(false));
 test('worker is bounded to five sends', () => expect(WORKER_BATCH_SIZE).toBe(5));
 test('provider outage retries', () => expect(retryDecision(1,503,'2026-11-16T00:00:00Z',new Date('2026-11-16T00:00:00Z')).status).toBe('pending'));
 test('provider retry-after honored', () => expect(retryDecision(1,429,'2026-11-16T00:00:00Z',new Date('2026-11-16T00:00:00Z'),'120').availableAt).toBe('2026-11-16T00:02:00.000Z'));
 test('invalid provider credential stops retry', () => expect(retryDecision(1,401,'2026-11-16T00:00:00Z',new Date('2026-11-16T00:00:00Z')).status).toBe('failed'));
 test('ambiguous send is not retried outside safe window', () => expect(retryDecision(1,null,'2026-11-16T00:00:00Z',new Date('2026-11-16T23:00:00Z')).status).toBe('failed'));
 test('five delivery failures stop retry', () => expect(retryDecision(5,503,'2026-11-16T00:00:00Z',new Date('2026-11-16T00:00:00Z')).status).toBe('failed'));
 test('request sent is not a confirmed removal', () => expect(removalReportCounts([{status:'request_sent',sent_at:'2026-11-16',removed_at:null}], '2026-11-01')).toEqual({removed:0,sent:1,waiting:1}));
 test('removed count requires dated proof', () => expect(removalReportCounts([{status:'removed',sent_at:'2026-10-01',removed_at:'2026-11-16'}], '2026-11-01')).toEqual({removed:1,sent:0,waiting:0}));
});
