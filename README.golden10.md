# Golden-10 Test Suite

Automated test runner for validating Phase 1 privacy contact discovery accuracy across 10 major domains.

## Quick Start

```bash
# With Deno (recommended)
deno run --allow-net --allow-read --allow-write golden10.ts

# With Node.js 18+
node golden10.ts
```

## Configuration

Edit `golden10.config.json` to:
- Update `functionUrl` if needed (currently points to production edge function)
- Adjust timeout (default 30s)
- Modify test domains, expectations, or add new cases

## Test Format

Each test case validates:
- **expect**: Keywords that MUST appear in the discovered URL
- **deny**: Keywords that MUST NOT appear (e.g., "terms" vs "privacy")
- **kind**: Expected policy type (`html`, `pdf`, or `html|pdf`)

## Output

Console table showing:
- ✅/❌ pass/fail per domain
- Time taken in milliseconds
- Discovered URL or error message

Plus a machine-readable `golden10.summary.json` with full results.

## Acceptance Gates (Phase 1.1)

- **≥8/10** domains pass
- **Median time ≤2.5s**
- **No domain >25s** (budget limit)
- **Zero logs** with exposed emails/tokens

## Smoke Tests

Quick manual verification:

```bash
# Grubhub
curl -X POST https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/discover-privacy-contacts \
  -H 'Content-Type: application/json' \
  -d '{"service_domain":"grubhub.com"}' | jq

# United Airlines
curl -X POST https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/discover-privacy-contacts \
  -H 'Content-Type: application/json' \
  -d '{"service_domain":"united.com"}' | jq
```

Expect responses to include:
- `url`: Discovered policy URL
- `policy_type`: "html" or "pdf"
- `confidence`: "high" or "medium"
- `method_used`: "simple_fetch" or "browserless"
- `lang_detected`: Language code
- `reasons`: Array of reasoning strings

## Next Steps (Phase 1.2)

After golden-10 passes:
1. Add `.well-known/security.txt` and `sitemap.xml` probes
2. Implement vendor platform detection (OneTrust, Securiti, TrustArc)
3. Create metrics table and dashboard
4. Expand to Golden-25 with PDF-only and locale-specific policies
