-- Reset privacy contacts that were marked "verified" through the missing-authorization hole
-- in the validate-email-contact edge function.
--
-- WHAT HAPPENED
-- That function computed has_role(user, 'admin') and then never used the result. Any
-- authenticated user could POST { email, serviceId, contactId, updateDatabase: true } and the
-- function's SERVICE-ROLE client (which bypasses RLS) would stamp
--   service_catalog.contact_verified = true, service_catalog.privacy_email = <their email>
--   privacy_contacts.verified = true, privacy_contacts.mx_validated = true
-- on GLOBAL, SHARED rows. The only check was an MX lookup, which proves a domain accepts mail
-- -- not that the address belongs to that company.
--
-- send-deletion-request mails whichever address those rows hold the requesting user's name,
-- email and account identifiers, and CCs the user, so a wrong address is a live PII leak.
-- Production held, among others, GitHub with privacy_email = privacy@dropbox.com: a deletion
-- request for GitHub would have shipped a stranger's identifiers to Dropbox.
--
-- HOW THIS CLEANUP WORKS
-- It is written set-based against service_catalog.domain rather than naming any specific
-- service, so it also catches the poisoned rows nobody has spotted yet.
--
-- IT INTENTIONALLY ERRS TOWARD UNVERIFYING. A company that legitimately uses an unrelated mail
-- domain (an outsourced DSAR processor, a parent company's domain, a rebrand) will be
-- unverified here and will need an admin to re-approve it. That is the cheap failure: one
-- re-review. The expensive failure is leaving a hostile address flagged verified and mailing
-- users' PII to it. So any row we cannot positively tie back to the service's own domain loses
-- its trust flag.
--
-- NOTHING IS DELETED. service_catalog.privacy_email and privacy_contacts.value are deliberately
-- left in place: they are the evidence an admin needs in order to re-review, and most of them
-- are probably correct. Only the trust flags are cleared. Both consumers
-- (send-deletion-request and DeletionRequestDialog) require contact_verified / verified before
-- they will use an address, so clearing the flag is sufficient to stop the leak, and it is
-- reversible by an admin in a way that a DELETE would not be.
--
-- privacy_contacts.mx_validated is also left alone -- it is a factual statement about DNS, not
-- a trust decision, and re-running the MX check would just set it back to true.
--
-- IDEMPOTENT: it only ever flips true -> false, and it matches on the current flag, so a second
-- run is a no-op.

-- Shared plausibility test, used by both updates below. Created for this migration only and
-- dropped at the end -- it is a cleanup heuristic, not something callers should depend on.
CREATE OR REPLACE FUNCTION public.__reset_contacts_domain_is_plausible(
  p_email TEXT,
  p_service_domain TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  WITH normalized AS (
    SELECT
      -- Everything right of the last '@', lowercased, trailing root dot stripped.
      regexp_replace(lower(split_part(coalesce(p_email, ''), '@', 2)), '\.$', '') AS email_domain,
      -- Catalog domains are stored bare ('github.com'), but tolerate a 'www.' prefix or a
      -- stray path so a formatting quirk cannot masquerade as a mismatch.
      regexp_replace(
        regexp_replace(lower(trim(coalesce(p_service_domain, ''))), '^www\.', ''),
        '/.*$', ''
      ) AS svc_domain
  ),
  labelled AS (
    SELECT
      email_domain,
      svc_domain,
      -- "Core label": the brand label sitting immediately left of the public suffix.
      -- 'privacy.github.com' -> 'github', 'support.google.co.uk' -> 'google'.
      -- Two-label suffixes (.co.uk, .com.au, .co.jp ...) are stripped first, otherwise the
      -- plain TLD is; then we keep the last remaining label. This is a pragmatic stand-in for
      -- a full public-suffix list, which Postgres does not carry.
      regexp_replace(
        CASE
          WHEN email_domain ~ '\.(co|com|net|org|gov|edu|ac|or|ne|go)\.[a-z]{2}$'
            THEN regexp_replace(email_domain, '\.(co|com|net|org|gov|edu|ac|or|ne|go)\.[a-z]{2}$', '')
          ELSE regexp_replace(email_domain, '\.[a-z]{2,}$', '')
        END, '^.*\.', ''
      ) AS email_core,
      regexp_replace(
        CASE
          WHEN svc_domain ~ '\.(co|com|net|org|gov|edu|ac|or|ne|go)\.[a-z]{2}$'
            THEN regexp_replace(svc_domain, '\.(co|com|net|org|gov|edu|ac|or|ne|go)\.[a-z]{2}$', '')
          ELSE regexp_replace(svc_domain, '\.[a-z]{2,}$', '')
        END, '^.*\.', ''
      ) AS svc_core
    FROM normalized
  )
  SELECT
    -- An empty domain on either side is never plausible. In particular this means a row
    -- flagged contact_verified with a NULL/blank privacy_email gets unverified, which is
    -- correct: "verified" with nothing to verify is meaningless.
    email_domain <> ''
    AND svc_domain <> ''
    AND (
      -- Exact match: privacy@github.com for github.com.
      email_domain = svc_domain
      -- Mail domain is a subdomain of the service domain: privacy.github.com for github.com.
      -- right()/length() rather than LIKE so that '_' in a domain cannot act as a wildcard.
      OR right(email_domain, length(svc_domain) + 1) = '.' || svc_domain
      -- ...or the other way round: catalog domain accounts.google.com, mail at google.com.
      OR right(svc_domain, length(email_domain) + 1) = '.' || email_domain
      -- Same brand on a different TLD: github.io / github.com, bbc.co.uk / bbc.com. This is
      -- the "different but related mail domain" allowance. It is deliberately the loosest rule
      -- here, and it is a data-cleanup heuristic only -- a lookalike registration such as
      -- github.co would slip through it. The actual security control is the admin gate in
      -- supabase/functions/validate-email-contact/index.ts; this migration only cleans up the
      -- damage done while that gate was missing.
      OR (email_core <> '' AND email_core = svc_core)
    )
  FROM labelled;
$$;

-- 1. service_catalog: clear contact_verified where the stored privacy_email cannot be tied to
--    the service's own domain. privacy_email is retained for admin re-review.
--
--    Form-only services are unaffected in practice: the privacy_form_url branches in
--    send-deletion-request and DeletionRequestDialog do not consult contact_verified at all,
--    so clearing the flag on a row whose real contact method is a web form changes no behaviour.
UPDATE public.service_catalog s
SET contact_verified = false
WHERE s.contact_verified IS TRUE
  AND NOT public.__reset_contacts_domain_is_plausible(s.privacy_email, s.domain);

-- 2. privacy_contacts: same treatment, and it matters more -- send-deletion-request checks
--    privacy_contacts FIRST and only falls back to the catalog, so a poisoned row here wins
--    over a correct catalog entry. Only email rows are in scope; 'form' and 'phone' values are
--    not addresses this hole could write and their domains are not comparable this way.
UPDATE public.privacy_contacts pc
SET verified = false
FROM public.service_catalog s
WHERE pc.service_id = s.id
  AND pc.verified IS TRUE
  AND pc.contact_type = 'email'
  AND NOT public.__reset_contacts_domain_is_plausible(pc.value, s.domain);

-- 3. Orphans: a verified email contact whose service row is gone cannot be checked against any
--    domain, so it cannot be trusted either. (The FK is ON DELETE CASCADE, so this should match
--    nothing; it is here so the cleanup has no silent gap.)
UPDATE public.privacy_contacts pc
SET verified = false
WHERE pc.verified IS TRUE
  AND pc.contact_type = 'email'
  AND pc.service_id IS NULL;

DROP FUNCTION public.__reset_contacts_domain_is_plausible(TEXT, TEXT);
