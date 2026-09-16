# Runbook: Bulk Privacy-Contact Discovery

**Owner:** whoever is on ops duty. **Audience:** an admin operator at a terminal.
**Blast radius:** writes `service_catalog.privacy_email` / `contact_verified` and
`privacy_contacts.verified` — global rows shared by every tenant. Read
["Landmines"](#12-landmines) before you start.

## Why this job exists

`send-deletion-request` refuses to mail anything unless the service has a verified
contact. The refusal is
[`supabase/functions/send-deletion-request/index.ts:340-353`](../supabase/functions/send-deletion-request/index.ts):

```
if (!recipientEmail) → 400 "This service does not have a verified contact email."
```

`recipientEmail` is resolved at lines 306-325, in this order:

1. `privacy_contacts` row for the service with `contact_type = 'email'` AND `verified = true`
   (`contact_source = "verified_privacy_contacts"`)
2. else `service_catalog.privacy_email` when `service_catalog.contact_verified = true`
   (`contact_source = "verified_catalog"`)
3. else `service_catalog.privacy_form_url` → a different 400 ("form submission not implemented")

At the time this runbook was written the catalog held **169 services with 10 verified**
(and one of those 10 was wrong — GitHub pointed at `privacy@dropbox.com`). That means
the paid deletion feature 400s for roughly 94% of the catalog. Running this job is the
single highest-leverage fix available, and the machinery to do it already exists and has
never been run at scale.

Do not trust the 169/10 figures. Measure them in step 2.

---

## 1. Prerequisites

### 1.1 An admin account

Every entry point is admin-gated. You need a row in `user_roles` with
`role = 'admin'` for your user id.

| Gate | Where | What happens without it |
| --- | --- | --- |
| `bulk-discover-contacts` | `index.ts:44-56` — selects `user_roles` for `role='admin'` | `403 {"error":"Admin access required"}` on every action |
| `/admin` page | `src/pages/Admin.tsx:27,71` via `useAdminAuth` | redirected to `/` with a toast |
| `validate-email-contact` DB writes | `index.ts:188-216` — `has_role(user, 'admin')` RPC, fails closed | `403 Forbidden - admin role required to verify privacy contacts`; the MX lookup itself stays open to any authenticated user |
| `bulk_discovery_jobs` table | RLS, `has_role(auth.uid(),'admin')` for select/insert/update | job rows invisible, progress polling returns nothing |

The admin requirement on `validate-email-contact` is **new and load-bearing**. The bulk
runner calls it with `updateDatabase: true` for every discovered email
(`bulk-discover-contacts/index.ts:281-291`). The nested call inherits your
`Authorization` header, so it runs as *you*. If you are not an admin the discovery half
of the job still runs and writes unverified rows to `privacy_contacts`, and the
verification half fails 403 on every single service — you burn the full OpenAI spend and
end with zero new verified contacts. Confirm your role before you start:

```sql
-- Supabase SQL editor. Expect one row.
select ur.role
from user_roles ur
join auth.users u on u.id = ur.user_id
where u.email = '<your-admin-email>' and ur.role = 'admin';
```

### 1.2 Secrets

Set via `supabase secrets set NAME=value` or Dashboard → Edge Functions → Secrets
(same convention as `GO-LIVE.md`).

| Secret | Required? | What it buys | What happens without it |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | **Effectively required** | The `gpt-4o-mini` extraction pass over the privacy-policy text (`discover-privacy-contacts/index.ts:2019, 2124-2215`) | The function falls back to the deterministic regex prepass (`regexPrepassExtract`, line ~2015). If the prepass found nothing it throws `OPENAI_API_KEY not configured` and the service fails. Yield drops hard — the prepass alone resolves the easy `privacy@domain` cases and nothing else. |
| `BROWSERLESS_API_KEY` | Recommended | Headless-render retry for up to 3 URLs per service when plain fetch fails or the page needs JS (`index.ts:1761-1825`) | `shouldUseBrowserless` is false, Phase 2 is skipped entirely. Services whose policy is client-rendered or behind soft bot-protection fail with `POLICY_NOT_FOUND` / `ACCESS_DENIED`. The job still completes; it just finds fewer contacts. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | `validate-email-contact` uses it for the actual catalog write (`index.ts:242-243`) | Every verification 500s. The discovery half succeeds and nothing gets verified. |

Neither AI key is checked at job start. A missing `OPENAI_API_KEY` surfaces only as
per-service failures deep in the run, so verify both are present before kicking off.

### 1.3 Functions deployed

```bash
supabase functions deploy bulk-discover-contacts
supabase functions deploy discover-privacy-contacts
supabase functions deploy validate-email-contact
```

All three are `verify_jwt = false` in `supabase/config.toml` — they do their own auth in
code, which is why the admin checks above matter.

### 1.4 The poisoned-row cleanup must already be applied

`supabase/migrations/20260916120100_reset_unverified_privacy_contacts.sql` clears
`contact_verified` / `verified` on any row whose email domain cannot be tied back to the
service's own domain. **Apply it first.** The bulk job only selects services where
`contact_verified` is null or false (`bulk-discover-contacts/index.ts:96, 121`), so a
row that is *wrongly* flagged verified is invisible to this job and will never be fixed
by it. Check whether it has landed:

```sql
-- Should return 0 rows. Any row here is a mismatched contact still flagged verified.
select s.name, s.domain, s.privacy_email
from service_catalog s
where s.contact_verified is true
  and split_part(lower(coalesce(s.privacy_email,'')), '@', 2)
      <> regexp_replace(lower(s.domain), '^www\.', '');
```

If GitHub still shows `privacy@dropbox.com`, run `npm run db:push` (or apply that
migration in the dashboard) before going further.

---

## 2. Record the baseline

Do this before anything else and paste the numbers into your run notes. Without a
baseline you cannot tell whether the run worked.

```sql
select
  count(*)                                              as total_services,
  count(*) filter (where contact_verified is true)      as verified_catalog,
  count(*) filter (where privacy_form_url is not null)  as has_form_url
from service_catalog;

select count(distinct service_id) as services_with_verified_email
from privacy_contacts
where contact_type = 'email' and verified is true;
```

The second number is the one that matters most: `send-deletion-request` checks
`privacy_contacts` **first**.

---

## 3. What actually happens per service

Read this once. It explains every result you will see.

`bulk-discover-contacts` loops services sequentially and, per service, does exactly two
things (`index.ts:226-333`):

1. invoke `discover-privacy-contacts` with `{ service_id }`
2. if the result contains a contact with `contact_type === 'email'`, invoke
   `validate-email-contact` with `{ email, serviceId, contactId, updateDatabase: true }`

`discover-privacy-contacts` per domain, in order, short-circuiting on the first hit:

| Step | Where | Notes |
| --- | --- | --- |
| Quarantine check | `index.ts:1462` | 24h auto-mute; returns **429 `QUARANTINED`**, counted as a failure |
| Cross-domain cache | `:1476-1527` | reuses `privacy_contacts` from any service on the same apex domain, `high`/`medium` confidence, updated within 90 days. Returns `method_used: 'cache'`, costs $0 |
| Curated table | `:1532-1589` | hardcoded `CURATED_CONTACTS` for domains that always block (vercel, airtable, bestbuy, …). Inserted with `verified: false` |
| Probes | `:1592-1650` | `security.txt`, `robots.txt` → sitemap, sitemap (cached) |
| URL candidates | `:1660-1717` | tier-1 (sitemap hits, catalog `privacy_form_url`, `/privacy`, `/privacy-policy`, …) + tier-2 (20 lazier paths), deduped www/non-www, ranked by detected locale |
| Phase 1 fetch | `:1751` | plain fetch with `ATTEMPT_TIMEOUT_MS` per attempt, early-stops at `EARLY_STOP_CONFIDENCE` |
| Phase 2 Browserless | `:1761-1825` | only if phase 1 produced nothing, or URLs were flagged JS-needed, or a domain hint says `requires_js`. Skipped if ≥80% of >5 attempts were network errors, or >50s elapsed. Max 3 URLs |
| security.txt fallback | `:1830-1891` | last-resort contact if both phases failed |
| Policy validator | `:1922-1934` | rejects junk URLs even when "discovered" |
| PDF policies | `:1956-2000` | returns `success: true` with **0 contacts** and `requires_manual_review` — never stored |
| Regex prepass | `:2015` | deterministic extraction, runs before the LLM and backstops it |
| LLM extraction | `:2124-2215` | `gpt-4o-mini`, forced tool call, `max_tokens: 1000` |
| Grounding check | `_shared/discovery_ai.ts:101-141` | rejects any AI value not literally present in the fetched policy text |
| Filters | `:2230-2290` | drops low confidence, homepages, the policy URL itself, generic `/contact`, bad email format, mismatched email domains |
| Form URL liveness | `:2309-2327` | GETs each form URL, discards soft-404s and non-privacy pages |
| Insert | `:2330-2367` | `privacy_contacts` rows with `verified: false`, `added_by: 'ai'` |

Everything discovery writes is **unverified**. Only `validate-email-contact` flips the
trust flags, and all it proves is that the domain has MX records — read
[section 9](#9-spotting-a-wrong-contact) before you believe any of it.

### 3.1 Environment knobs

Defaults are sane. Change nothing on the first run; these are here for when you are
tuning a re-run.

| Var | Default | Clamp | Effect |
| --- | --- | --- | --- |
| `DISCOVERY_DOMAIN_BUDGET_MS` | 25000 | 3000–60000 | total wall-clock budget for one domain |
| `TAIL_P95_GOAL_MS` | 5000 | 3000–8000 | latency goal the attempt loop aims at |
| `ATTEMPT_TIMEOUT_MS` | 8000 | 2000–15000 | per-URL fetch timeout |
| `EARLY_STOP_CONFIDENCE` | 70 | 30–100 | stop trying more URLs once a candidate scores this well. Lower = faster, more false hits; higher = slower, better precision |
| `PROBE_TIMEOUT_MS` (`_shared/probes.ts:18`) | 4000 | 1500–15000 | security.txt / robots.txt / sitemap fetch timeout |
| `SITEMAP_MAX_LOCS` (`probes.ts:19`) | 200 | 25–2000 | max sitemap `<loc>` entries parsed |
| `SITEMAP_MAX_BYTES` (`probes.ts:20`) | 5000000 | 200KB–10MB | sitemap size ceiling |
| `PROBE_SECURITY_TXT`, `PROBE_SITEMAP`, `DETECT_VENDOR`, `DETECT_LANG`, `CACHE_SITEMAP`, `ENABLE_T2` | all on | — | set the string `'false'` to disable |
| `SLOW_BUDGET_OVERRIDES` | unset | per-entry 3000–60000 | `"slowdomain.com:45000,other.com:40000"` |
| `DISCOVERY_DISABLE_METRICS` | off | — | set `'true'` only if `discovery_metrics` is causing trouble; it blinds section 6 |

A **blank** value is treated as unset, not as zero (`index.ts:39-43`), so an empty env var
in a deploy config will not silently collapse a budget to its floor.

There is also an internal `GLOBAL_BUDGET_MS = 50000` (`index.ts:1776`) that is not
configurable: past 50s elapsed, Browserless is skipped for that domain.

---

## 4. Kicking the job off

### 4.1 Preferred: the admin UI

1. Sign in as your admin user.
2. Go to `/admin` (`src/App.tsx:102`). Non-admins are bounced to `/`.
3. Scroll to the **Bulk Contact Discovery** card (`src/pages/Admin.tsx:1270`).
4. Read the three tiles: services to process, estimated cost, estimated time. They come
   from `action: 'estimate'`.
5. Click **Start Bulk Discovery**.

Ignore two pieces of UI in that card. The "Will scan: <addresses>" alert and the "No
email accounts connected" warning (`BulkDiscoveryTool.tsx:301-332`) are copy-paste from
the inbox-scanning feature and have nothing to do with this job — they do not gate the
Start button. The `scanType` state (`:49`, `:160-163`, `:168`) is likewise inert: the
edge function destructures only `{ action, jobId, batchSize }` (`index.ts:58`) and never
reads `scanType`.

The UI hardcodes `batchSize: 5` (`:168`, `:232`).

### 4.2 Terminal: curl

Use this when you need a non-default `batchSize`, or to resume a stalled job (the UI
cannot — see [section 10](#10-re-running-only-the-failures)).

```bash
# Project ref and anon key live in .env / src/integrations/supabase/client.ts
export SB_URL="https://gqxkeezkajkiyjpnjgkx.supabase.co"
export SB_ANON="$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'"' -f2)"

# Your admin ACCESS TOKEN (not the anon key). Easiest source: sign in at /admin, then in
# devtools console:
#   JSON.parse(localStorage.getItem('sb-gqxkeezkajkiyjpnjgkx-auth-token')).access_token
export SB_JWT="<paste>"

call() {  # call <json-body>
  curl -sS -X POST "$SB_URL/functions/v1/bulk-discover-contacts" \
    -H "Authorization: Bearer $SB_JWT" \
    -H "apikey: $SB_ANON" \
    -H "Content-Type: application/json" \
    -d "$1"
}
```

```bash
# 1. Dry run. Costs nothing, writes nothing.
call '{"action":"estimate"}'
# → {"totalServices":159,"estimatedCost":"1.75","estimatedTimeMinutes":16}

# 2. Start. Returns the job row immediately; work continues in the background.
call '{"action":"start","batchSize":5}'
# → {"job":{"id":"<JOB_ID>","status":"running","total_services":159,...}}
export JOB_ID="<copy the id>"

# 3. Pause / resume.
call "{\"action\":\"pause\",\"jobId\":\"$JOB_ID\"}"
call "{\"action\":\"resume\",\"jobId\":\"$JOB_ID\"}"   # flips status ONLY
call "{\"action\":\"process\",\"jobId\":\"$JOB_ID\",\"batchSize\":5}"  # actually restarts work
```

`resume` only updates `status` (`index.ts:173-184`). It does **not** restart processing.
The UI fires `resume` then `process` back to back (`BulkDiscoveryTool.tsx:222-233`); by
curl you must do the same, in that order.

### 4.3 Canary first

Do not start with the whole catalog. Verify the pipeline end to end on a handful of
services, then run the rest:

1. Pick 3-5 services you can eyeball (a big one, a small one, one you expect to be hard).
2. Temporarily set `contact_verified = true` on everything else so `estimate`/`start`
   only pick up your canaries — **or**, safer and with no writes at all, invoke
   `discover-privacy-contacts` directly per service id:

```bash
curl -sS -X POST "$SB_URL/functions/v1/discover-privacy-contacts" \
  -H "Authorization: Bearer $SB_JWT" -H "apikey: $SB_ANON" \
  -H "Content-Type: application/json" \
  -d '{"service_id":"<uuid>"}' | jq '{success, method_used, confidence, contacts}'
```

Prefer the direct-invoke option. Mass-flipping `contact_verified` to fake a small run is
exactly the kind of edit that strands the catalog if you get interrupted.

Note that `/debug/discovery` (`src/pages/DiscoveryDebug.tsx`) is **not** a working
substitute: it posts `{ serviceName, domain, debug }` (`:31-37`), while the function
requires `service_id` and throws `service_id is required` (`:1445-1447`). It will fail on
every domain you type. Use the curl above instead.

---

## 5. batchSize: what to use and why

**Use 5.** Change it only for the reasons below.

`batchSize` does **not** control concurrency. Look at
`processJobInBackground` (`index.ts:210-337`): the outer loop slices `remainingIds` into
chunks of `batchSize`, and the inner loop `for (const serviceId of batch)` awaits each
service one at a time. Services are processed strictly sequentially no matter what you
pass. What `batchSize` actually changes is:

1. **Pause responsiveness.** The `status === 'paused'` check happens once per batch
   (`:212-221`). With `batchSize: 5` a pause takes effect after at most 5 services — up
   to ~4 minutes if those services are slow. With `batchSize: 20` you could wait 15+
   minutes for a pause to land.
2. **Sleep overhead.** There is a fixed 1s delay between batches (`:336`).
   169 services ÷ 5 = 34 batches = 34 seconds of total sleeping. At `batchSize: 1` that
   becomes 169 seconds, and you gain nothing but pause responsiveness.

So: **5** is the right default and matches the UI. Use **2-3** when you are babysitting a
risky re-run and want to be able to stop it quickly. Do not go above 10 — you lose the
ability to stop the job promptly and save only a few seconds of sleep.

Rate limiting is **not** a reason to raise it. Because execution is serial, the request
rate to OpenAI and to target domains is one-at-a-time regardless.

---

## 6. Monitoring

Progress is written after **every service**, not every batch (`index.ts:317-326`), so the
job row is an accurate live counter.

**The UI:** the card polls `bulk_discovery_jobs` every 3 seconds while status is
`running` (`BulkDiscoveryTool.tsx:105-113`) and shows processed/total, successful,
failed, actual cost and remaining.

**SQL (authoritative):**

```sql
select id, status, processed_services, total_services,
       successful_discoveries, failed_discoveries,
       round(actual_cost::numeric, 3) as counted_cost,
       started_at, completed_at, error_message,
       now() - started_at as elapsed
from bulk_discovery_jobs
order by created_at desc
limit 1;
```

**Stall detection.** Re-run that query 2 minutes apart. If `processed_services` has not
moved and `status` is still `running`, the background task is dead — see
[section 10.1](#101-the-job-stalled). This is expected at least once during a 169-service
run.

**Live edge logs.** Dashboard → Edge Functions → *(function)* → Logs is the reliable
path. The CLI equivalent depends on your Supabase CLI version — check
`supabase functions logs --help` before relying on it in a script:

```bash
supabase functions logs bulk-discover-contacts
supabase functions logs discover-privacy-contacts
```

Useful log lines: `[Cache] ✓ Reusing`, `[Curated] ✓ Found`, `[Probe] ✓`,
`browserless_invocation` (JSON, for Browserless spend), `[Cost] OpenAI tokens: N in / M out`,
`[Filter] Rejected …`, `[Quarantine] <domain> → bot_protection`,
`[validate-email-contact] DENIED database write for non-admin user …`.

That last line means your token is not an admin's. Stop and fix it.

**Per-domain outcomes** (`discovery_metrics`, one row per discovery attempt):

```sql
select domain, success, method_used, error_code, time_ms,
       llm_calls, input_tokens, output_tokens, browserless_used, confidence
from discovery_metrics
where created_at >= now() - interval '2 hours'
order by created_at desc;

-- failure shape
select error_code, count(*)
from discovery_metrics
where created_at >= now() - interval '2 hours' and success = false
group by error_code order by 2 desc;
```

`ops/runbook.md` has the incident-response playbook for each `error_code` — use it if one
code dominates.

---

## 7. Cost

### 7.1 What the product tells you (and why it is wrong)

`estimate` and `start` both compute `totalServices * 0.011`
(`index.ts:105, 126`), and `actual_cost` accumulates the same hardcoded constants —
`+= 0.011` per discovery, `+= 0.001` per validation (`:262, 271, 275, 293, 306`), added
even when the attempt fails. **`actual_cost` is a counter, not a measurement.** It never
reads a token count, never sees a Browserless invoice, and reports the same number
whether OpenAI was called or the result came free from cache.

For 169 services the UI will say **169 × $0.011 = $1.86**. Treat that as a ceiling with
Browserless excluded, not as the bill.

### 7.2 Modelled OpenAI cost

Assumptions, all stated so you can redo the arithmetic when they change:

- **A1.** Model is `gpt-4o-mini` (`index.ts:2121`, pinned deliberately — the comment
  records that `gpt-5-mini` produced unstable tool-call shapes).
- **A2.** List price **$0.15 / 1M input tokens**, **$0.60 / 1M output tokens**. *Verify
  against OpenAI's current pricing page before quoting this to anyone.*
- **A3.** Policy text handed to the model is capped at 10,000 characters by
  `extractSmartContentWindow(strippedText, 10000)` (`index.ts:1167, 1336`). At ~4
  chars/token that is ~2,500 tokens; the system prompt plus tool schema adds roughly 600.
  Round up: **3,500 input tokens per service**.
- **A4.** Output is capped at `max_tokens: 1000` (`:2122`). A realistic structured answer
  is 150-400 tokens. Use the pessimistic **400**.
- **A5.** Exactly one LLM call per service that reaches the AI step. Cache hits, curated
  domains, PDF policies and fetch failures never reach it, so this is an upper bound.

```
input   3,500 tok × $0.15 / 1,000,000 = $0.000525
output    400 tok × $0.60 / 1,000,000 = $0.000240
                              per service = $0.000765   (~0.08 cents)

169 services × $0.000765          ≈ $0.129
```

**≈ $0.13 for the full catalog, with a realistic ceiling under $0.20.** That is ~14×
cheaper than the $1.86 the UI quotes. Cost is not a reason to hesitate on this job.

### 7.3 Browserless

Unknown — this runbook will not invent a number. What the code guarantees:

- It is only invoked when Phase 1 produced nothing, or URLs were flagged JS-needed, or a
  domain hint says `requires_js` (`index.ts:1787-1792`).
- It is capped at **3 URLs per service** (`:1796-1798`).
- Absolute worst case, every one of 169 services triggers it: **169 × 3 = 507 page
  renders.**

Browserless bills per unit/session and the rate depends entirely on your plan. Check the
plan's included quota against 507 renders before starting. In practice the count will be
far lower — grep the logs for `browserless_invocation` during the canary to get the real
trigger rate, then extrapolate.

### 7.4 Time

`estimatedTimeMinutes` is `ceil(total / 10)` (`index.ts:110`) — 17 minutes for 169. That
assumes 6s/service and is optimistic. Realistic bounds, given
`DISCOVERY_DOMAIN_BUDGET_MS` of 25s, the internal 50s global budget, the MX lookups
(2 × 10s worst case) and 34 seconds of inter-batch sleep:

```
typical  169 × ~12s + 34s ≈ 35 minutes
worst    169 × ~50s + 34s ≈ 2.4 hours
```

Plan for the job to need several resume cycles ([section 10.1](#101-the-job-stalled)).

---

## 8. Reviewing results before you trust them

The job's own `successful_discoveries` counter is a weak signal. It increments **only**
when an email contact was found *and* MX validation returned `isValid`
(`index.ts:298-299`). A service that legitimately only offers a web form, or whose policy
is a PDF, is counted as a **failure** even though discovery worked correctly.

Run all of these after the job reports `completed`.

**8.1 Did the number that matters move?**

```sql
select
  count(*) as total,
  count(*) filter (where contact_verified is true) as verified_catalog
from service_catalog;

select count(distinct service_id) as services_with_verified_email
from privacy_contacts
where contact_type = 'email' and verified is true;
```

Compare against your section-2 baseline.

**8.2 Read every newly verified contact.** At this catalog size (~150 rows) this is
30 minutes of work and it is not optional — these addresses receive users' real PII.

```sql
select s.name, s.domain, s.privacy_email,
       pc.value, pc.confidence, pc.added_by, pc.source_url, pc.reasoning
from service_catalog s
left join privacy_contacts pc
  on pc.service_id = s.id and pc.contact_type = 'email' and pc.verified is true
where s.contact_verified is true
order by s.name;
```

Check each row against: does the email domain belong to this company? Is
`source_url` actually that company's privacy policy? Does `reasoning` cite something real?

**8.3 Triage the failures.**

```sql
select f.failure_type, s.name, s.domain, f.error_message, f.created_at
from contact_discovery_failures f
join service_catalog s on s.id = f.service_id
where f.created_at >= now() - interval '6 hours'
order by f.created_at desc;
```

`failure_type` values: `fetch_failed`, `no_policy_found`, `ai_error`, `no_contacts_found`,
`all_filtered`. `all_filtered` means the AI *did* return contacts and every one was
rejected by the quality filters (`index.ts:2291-2308`) — those are worth a manual look,
the site may have a real contact the filters were too strict about. The admin page also
renders this as the **Failed Discoveries Log** card next to the bulk tool.

**8.4 Services that need a human, not a re-run.** PDF policies return
`success: true, contacts_found: 0, requires_manual_review: true` and store nothing
(`index.ts:1956-2000`). They will never self-resolve. Find them in the logs
(`[PDF Policy] Found PDF policy at …`) and handle them via the **Manual Contact Review** /
**Contact Verification** cards on `/admin`.

**8.5 Smoke-test the actual product.** Pick 3 newly verified services and call
`send-deletion-request` with `preview_only: true` — it returns the resolved recipient and
`contact_source` without sending anything (`send-deletion-request/index.ts:355-367`).
That is the only check that proves the 400 is gone.

---

## 9. Spotting a wrong contact

### 9.1 How `privacy@dropbox.com` got onto GitHub

Two independent holes, and only one is closed.

**Hole 1 (closed).** `validate-email-contact` computed `has_role(user,'admin')` and then
never used the result, so any authenticated user could POST
`{ email, serviceId, updateDatabase: true }` and the function's service-role client would
stamp the shared catalog. That is now the fail-closed gate at
`validate-email-contact/index.ts:188-216`, and the migration in
[section 1.4](#14-the-poisoned-row-cleanup-must-already-be-applied) unverifies the damage.

**Hole 2 (open, and this job exercises it).** The discovery filter at
`discover-privacy-contacts/index.ts:2273-2288`:

```ts
const isPrivacyEmail = ['privacy','dpo','gdpr','ccpa','data-protection']
  .some(prefix => contact.value.toLowerCase().startsWith(prefix + '@'));

if (!emailDomain.includes(serviceDomain) && !isPrivacyEmail) { /* reject */ }
```

The domain-mismatch check is **skipped entirely** for any address starting with
`privacy@`. So `privacy@dropbox.com` scraped off a GitHub-hosted page passes the filter,
gets inserted against GitHub, then MX-validates cleanly (dropbox.com obviously accepts
mail) and is marked verified. MX proves a domain accepts mail. It proves **nothing** about
who owns the address.

This job will reproduce that class of error on any policy page that quotes a third
party's privacy address — outsourced DSAR processors, parent companies, embedded vendor
boilerplate. Assume it happened and go looking.

### 9.2 The detection query — run it after every job

```sql
-- Every verified contact whose mail domain is not an exact match for the service domain.
-- Subdomains and legitimately different domains show up here too. It is a REVIEW list,
-- not an auto-reject list.
select s.name, s.domain, s.privacy_email,
       split_part(lower(s.privacy_email), '@', 2) as email_domain,
       'service_catalog' as source
from service_catalog s
where s.contact_verified is true
  and split_part(lower(coalesce(s.privacy_email,'')), '@', 2)
      <> regexp_replace(lower(s.domain), '^www\.', '')

union all

select s.name, s.domain, pc.value,
       split_part(lower(pc.value), '@', 2),
       'privacy_contacts'
from privacy_contacts pc
join service_catalog s on s.id = pc.service_id
where pc.contact_type = 'email' and pc.verified is true
  and split_part(lower(pc.value), '@', 2)
      <> regexp_replace(lower(s.domain), '^www\.', '')
order by 1;
```

For each row, decide:

| Pattern | Verdict |
| --- | --- |
| `privacy.github.com` for `github.com` (subdomain either way) | Keep |
| `bbc.co.uk` for `bbc.com` (same brand, different TLD) | Keep |
| `privacy@onetrust.com` on a non-OneTrust service | **Reject** — vendor boilerplate |
| `privacy@dropbox.com` on `github.com` | **Reject** — unrelated company |
| Unrecognisable domain, or you cannot confirm it in 60 seconds | **Reject.** One extra re-review is cheap; mailing a stranger's PII is not |
| Known outsourced DSAR processor you can positively confirm | Keep, and note why in your run log |

### 9.3 Rejecting one

```sql
-- Clear the trust flags. Keep the value: it is the evidence for the next reviewer,
-- and both consumers refuse to use an address without the flag, so this stops the leak.
update privacy_contacts
set verified = false
where id = '<contact_id>';

update service_catalog
set contact_verified = false
where id = '<service_id>';
```

Do not `DELETE`. The cleanup migration deliberately preserves values for exactly this
reason, and a delete is not reversible by the next admin.

To *replace* a contact with the right address, use the **Contact Verification** card on
`/admin` (`src/components/ContactVerification.tsx:206-242`) — its Approve action sets
`verified`/`contact_verified` and `privacy_email` in one go, under admin RLS.

---

## 10. Re-running only the failures

**There is no "retry failed" action.** You do not need one: `estimate` and `start` both
select `contact_verified.is.null,contact_verified.eq.false` (`index.ts:96, 121`).
Successfully verified services are already excluded. **Starting a fresh job *is* the
retry-failures path.** Confirm the scope first:

```bash
call '{"action":"estimate"}'   # totalServices should have dropped by your success count
```

Before re-running, clear the things that will make the re-run fail identically:

1. **Quarantine.** Domains that hit `bot_protection` twice in 24h are muted for 24h
   (`_shared/quarantine.ts`, `index.ts:2488-2508`) and return 429 `QUARANTINED` — a
   guaranteed failure. Either wait out the TTL or override:

```sql
select domain, reason, attempts, until_at
from discovery_quarantine
where until_at > now()
order by until_at desc;
```

```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... ACTOR=ops/<you> \
  npx tsx tools/quarantine-override.ts example.com "bulk re-run"
```

2. **The 90-day contact cache.** A domain with a bad-but-cached contact will hand back
   the same bad contact (`index.ts:1476-1527`) without re-fetching anything. Delete the
   offending `privacy_contacts` rows first if you want a genuinely fresh attempt.
3. **Tune, do not just repeat.** A re-run with identical settings produces identical
   results. For `no_policy_found`-heavy failures, raise
   `DISCOVERY_DOMAIN_BUDGET_MS` to 40000 and `ATTEMPT_TIMEOUT_MS` to 12000. For
   `ACCESS_DENIED`/`bot_protection`, confirm `BROWSERLESS_API_KEY` is set and check
   `ENABLE_T2` is on. For slow individual domains use
   `SLOW_BUDGET_OVERRIDES="slowsite.com:45000"`.

### 10.1 The job stalled

Expect this. `handleStart` fires `processJobInBackground(...)` without awaiting it and
without `EdgeRuntime.waitUntil` (`index.ts:145`), then returns the response immediately.
Edge functions are not guaranteed to keep running after the response is sent, and there
is a hard per-invocation wall-clock limit — so a 169-service loop will very likely be cut
off partway through, leaving the row stuck at `status: 'running'` with a frozen
`processed_services`. (The exact limit depends on your Supabase plan; check the dashboard
rather than guessing.)

Recovery is safe and designed for: `processJobInBackground` recomputes
`remainingIds = serviceIds - processedIds` on entry (`:201-203`), so resuming never
redoes completed work.

```bash
call "{\"action\":\"process\",\"jobId\":\"$JOB_ID\",\"batchSize\":5}"
```

Then watch `processed_services` climb again. Repeat until
`processed_services = total_services`, at which point the job flips itself to `completed`
(`:340-354`).

Two hard rules:

- **Never fire two `process` calls for the same job concurrently.** There is no lock.
  Both loops read the same `processedIds` and will double-process and double-charge.
- **The UI cannot do this.** Its Resume button only renders when `status === 'paused'`
  (`BulkDiscoveryTool.tsx:487`). A job stuck at `running` shows no button at all. Either
  use curl, or `pause` then `resume` via curl to get the UI back into a usable state.

### 10.2 Your JWT expires mid-run

The background loop reuses the `Authorization` header captured from your original request
(`index.ts:20`), and every nested `functions.invoke` forwards it. When that access token
expires (Supabase default is 1 hour unless your project changed it — check
Authentication → Settings), every subsequent discovery and validation 401s and the
remaining services all record as failures.

Symptom: `failed_discoveries` climbing steadily while `successful_discoveries` stays
frozen. Treat it as a stall — get a fresh token, then `process` again. This is another
reason to work in resumable chunks rather than firing one 169-service run and walking
away.

---

## 11. Definition of done

The run is complete when **all** of these hold:

- [ ] `bulk_discovery_jobs` newest row: `status = 'completed'` and
      `processed_services = total_services`.
- [ ] **Primary target: ≥ 100 of 169 services (≈60%) have a verified email contact** —
      that is, `count(distinct service_id)` in `privacy_contacts` where
      `contact_type='email' and verified is true`, plus catalog-only verifications, is
      ≥ 100.
- [ ] **Hard floor: ≥ 85 (50%).** Below this the deletion feature is still broken for
      most users and the run has not achieved its purpose — go to
      [section 10](#10-re-running-only-the-failures) and tune before declaring done.
- [ ] The section-9.2 mismatch query has been run and **every** row on it has an explicit
      keep/reject decision recorded.
- [ ] Zero rows where `contact_verified is true` and `privacy_email is null` or blank.
- [ ] 3 spot-checked services return a correct recipient from
      `send-deletion-request` with `preview_only: true`.
- [ ] Remaining failures are classified: form-only, PDF-policy, or genuinely-no-contact.
      Form-only and PDF services are queued for manual entry, not left for the next run.
- [ ] Actual OpenAI spend checked on the OpenAI dashboard against the ~$0.13 model in
      [section 7.2](#72-modelled-openai-cost). An order-of-magnitude miss means an
      assumption is wrong — find out which before the next run.
- [ ] Run notes recorded: before/after counts, job id, elapsed time, resume count,
      failure breakdown by `error_code`, rejected contacts and why.

**Why 60%.** The Golden-10 CI gate passes at 8/10 (`README.golden10.md`), but those are
hand-picked, well-behaved domains — the easy end. The long tail in this catalog will do
worse, and form-only and PDF-policy services are structurally unreachable by this
pipeline no matter how well it runs. 60% is a target, not a prediction. **This job has
never been run at scale, so the true achievable rate is unknown.** Whatever the first
full run produces is the real baseline; record it and set the next target from it.

---

## 12. Landmines

1. **A wrongly-verified row is invisible to this job.** `estimate`/`start` only select
   `contact_verified` null-or-false. Bad data that is flagged `true` is skipped forever.
   Run the cleanup migration first ([1.4](#14-the-poisoned-row-cleanup-must-already-be-applied)).
2. **`actual_cost` is fiction.** Hardcoded constants accumulated per attempt, charged even
   on failure, blind to token counts and to Browserless. Never quote it as spend.
3. **`successful_discoveries` undercounts.** Form-only and PDF services are recorded as
   failures even when discovery worked perfectly.
4. **`start` does not check for a running job.** Calling it twice creates two jobs over
   overlapping service sets and the UI only ever shows the newest
   (`BulkDiscoveryTool.tsx:136-156`). Check for a live job before starting.
5. **`resume` alone does nothing.** It flips a status field. Follow it with `process`.
6. **`privacy@anything.com` bypasses the domain check.** See
   [9.1](#91-how-privacydropboxcom-got-onto-github). This is still open — every run needs
   the section-9.2 review.
7. **MX validation is not identity verification.** `validate-email-contact` proves a
   domain accepts mail. Nothing more.
8. **`/debug/discovery` is broken.** It sends the wrong payload shape and fails on every
   domain. Use the direct curl in [4.3](#43-canary-first).
9. **Non-admin runs burn money for nothing.** Discovery succeeds and writes unverified
   rows; every verification 403s. Check your role first.
10. **The 90-day cross-domain cache masks re-runs.** A cached bad contact comes straight
    back without a fetch. Delete the row to force a fresh attempt.
11. **A cache hit verifies someone else's row.** On the cache path the returned contacts
    are `privacy_contacts` rows belonging to *another* service on the same apex domain
    (`index.ts:1476-1527`). The bulk runner forwards that row's `id` as `contactId`
    (`bulk-discover-contacts/index.ts:281-291`), so `verified` gets set on the other
    service's row while the current service gains only a `service_catalog` entry. Expect
    services with `contact_verified = true` and no `privacy_contacts` row of their own —
    that is this, not a bug in your review query. `send-deletion-request` still resolves
    them via the catalog fallback.

## Related docs

- `ops/runbook.md` — per-`error_code` incident response for the discovery service
- `README.golden10.md` — the CI gate this pipeline is measured against
- `README.metrics.md`, `README.monitoring.md`, `README.dashboards.md` — metrics plumbing
- `GO-LIVE.md` — full secrets inventory
