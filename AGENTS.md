# Architecture rules

- Public broker checks share one client helper for bounded requests and incomplete-result classification, so scan pages cannot interpret provider failures as an all-clear.
- Broker search failures must remain unknown and must never enter the successful-results cache; use versioned cache keys to avoid reusing legacy failed searches.
- Gmail metadata-only scans never send Gmail search queries; apply incremental date filtering to retrieved metadata and reject unsupported custom queries rather than silently ignoring them.- Broker removals: decision rules live in supabase/functions/_shared/broker-removals.ts (unit-tested); a listing is marked removed only by a successful scan after the request, and email requests go only to hand-verified broker addresses so unverified brokers fall back to the manual queue.
