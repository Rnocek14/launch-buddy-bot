-- Lead capture for the free scan and breach pages.
--
-- WHY THIS EXISTS
-- ---------------
-- Every SEO page on the site funnels into /free-scan, which took an email,
-- ran a breach check, rendered results and then discarded the address. The
-- `waitlist` table existed and Admin.tsx read from it, but nothing in the
-- codebase ever wrote to it. All organic traffic produced analytics rows and
-- nothing else.
--
-- CONSENT MODEL
-- -------------
-- A row here means someone ticked an unticked-by-default box asking to be
-- emailed. It is not a record of everyone who ran a scan — scanning without
-- consenting stores nothing at all, which is the point. For a company that
-- sells privacy, capturing addresses that were only ever typed in to use a
-- free tool would be indefensible, and the fact that it would convert better
-- is not a reason.
--
-- `consented_at`, `consent_copy` and `source_path` together are the audit
-- trail: what they agreed to, in what words, on which page. Storing the exact
-- consent wording matters because the wording will change over time and a
-- bare boolean cannot tell you what an old subscriber actually agreed to.

CREATE TABLE IF NOT EXISTS public.scan_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  -- Which surface captured it: "free_scan", "breach", "plan", etc.
  source text NOT NULL DEFAULT 'free_scan',
  -- The ?src= campaign parameter, when present.
  source_detail text,
  -- Path the consent was given on, e.g. "/breach/equifax".
  source_path text,
  -- Always true for rows that exist; kept explicit so the audit trail is
  -- readable on its own without needing to know the insert rules.
  consented boolean NOT NULL DEFAULT true,
  consented_at timestamptz NOT NULL DEFAULT now(),
  -- Verbatim copy of the checkbox label shown at the time of consent.
  consent_copy text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per address. Re-consenting refreshes the source and timestamp
-- rather than creating duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS scan_leads_email_key
  ON public.scan_leads (lower(email));

CREATE INDEX IF NOT EXISTS scan_leads_created_at_idx
  ON public.scan_leads (created_at DESC);

ALTER TABLE public.scan_leads ENABLE ROW LEVEL SECURITY;

-- Writes go through the capture-scan-lead edge function using the service
-- role. No anon or authenticated INSERT policy exists, so the table cannot be
-- stuffed from the browser by anyone who reads the bundle.
CREATE POLICY "Service role full access on scan_leads"
  ON public.scan_leads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can read the list from the dashboard. Read-only and role-gated:
-- a signed-in non-admin gets nothing, matching the discovery_metrics policy.
CREATE POLICY "Admins can read scan leads"
  ON public.scan_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
