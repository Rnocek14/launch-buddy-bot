-- Fix account deletion: auth.users foreign keys that block DELETE
--
-- delete-user-account clears a hardcoded list of tables and then calls
-- auth.admin.deleteUser(). Several columns referencing auth.users were created
-- with a bare "REFERENCES auth.users" and therefore default to ON DELETE NO
-- ACTION. A single surviving row in any of them makes the final auth.users
-- delete fail with 23503, so account deletion is *impossible* for the affected
-- users. public_results is the worst case: every user who has ever pressed
-- Share has a row there, permanently, and cannot be erased.
--
-- The rule applied below, chosen for a product whose whole job is erasure:
--
--   * A column that says WHOSE data the row is -> ON DELETE CASCADE.
--     The row is that person's personal data; an Article 17 request has to
--     remove it, and there is nobody else with a claim on it.
--
--   * A column that only records WHICH ACTOR touched a row belonging to an
--     organization or to another user (invited_by / initiated_by /
--     generated_by / overridden_by) -> ON DELETE SET NULL.
--     Cascading here would destroy a tenant's records because one admin closed
--     their personal account. Severing the link erases the personal data (the
--     auth.users reference) while leaving the record itself intact.
--
-- Idempotent: each constraint is inspected first and only rebuilt when its
-- current ON DELETE action differs from the target. Constraint names are read
-- from pg_constraint rather than assumed, and the discovered name is reused
-- when the constraint is recreated so nothing that references it by name drifts.

DO $$
DECLARE
  -- table, column, desired action ('c' = CASCADE, 'n' = SET NULL)
  target RECORD;
  v_conname TEXT;
  v_confdeltype "char";
  v_attnotnull BOOLEAN;
  v_action TEXT;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      -- Ownership columns: the row IS the user's personal data.

      -- A shared results page holds the user's risk score, service count and
      -- exposure categories on a public, unauthenticated URL. Erasure has to
      -- take the page down; user_id is NOT NULL so SET NULL is not available
      -- and would leave the page live anyway.
      ('public_results',   'user_id',      'c'),

      -- serp_requests_log is an audit/billing trail, so SET NULL looks like the
      -- careful choice. It is not: the trail is not anonymous once the user is
      -- unlinked. Its `query` column stores the literal broker search string,
      -- which for this
      -- product is the user's own name and location (see scan-brokers'
      -- logSerpRequest). Nulling user_id would leave a searchable record of
      -- "who we looked up" behind and would not be an erasure at all.
      -- The billing/anti-abuse function is unaffected: spend is accounted for
      -- in serp_usage_daily, a per-day aggregate counter that is never
      -- decremented and is not touched by this cascade. So we can delete the
      -- per-request rows and still keep an honest budget ledger.
      ('serp_requests_log', 'user_id',     'c'),

      -- Actor columns: the row belongs to an org or to another user.

      -- Which admin granted a comp/override subscription. The row is the
      -- *subscriber's*; cascading would delete a paying customer's subscription
      -- because an admin left. override_reason and overridden_at survive, so
      -- the audit trail still says what happened and when.
      ('subscriptions',        'overridden_by', 'n'),

      -- Who invited this member. The membership belongs to the member.
      ('organization_members', 'invited_by',    'n'),

      -- The three below are NOT NULL today, which is exactly why they block
      -- deletion with no good answer: CASCADE would delete an organization's
      -- pending invites, scan jobs and offboarding compliance reports when one
      -- admin closes their personal account. They are widened to nullable so
      -- "keep the org's record, forget who ran it" becomes expressible.
      ('organization_invites', 'invited_by',    'n'),
      ('org_scan_jobs',        'initiated_by',  'n'),
      ('offboarding_reports',  'generated_by',  'n')
    ) AS t(tbl, col, deltype)
  LOOP
    -- Skip cleanly if the table or column is not present in this environment.
    SELECT a.attnotnull INTO v_attnotnull
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = target.tbl
      AND a.attname = target.col
      AND a.attnum > 0
      AND NOT a.attisdropped;

    IF NOT FOUND THEN
      RAISE NOTICE 'skip %.% (table or column absent)', target.tbl, target.col;
      CONTINUE;
    END IF;

    -- Find the single-column FK from this column into auth.users by its real
    -- name, along with its current ON DELETE action.
    SELECT con.conname, con.confdeltype
    INTO v_conname, v_confdeltype
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_class rc ON rc.oid = con.confrelid
    JOIN pg_namespace rn ON rn.oid = rc.relnamespace
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
      AND c.relname = target.tbl
      AND rn.nspname = 'auth'
      AND rc.relname = 'users'
      AND con.conkey = ARRAY[(
        SELECT a.attnum FROM pg_attribute a
        WHERE a.attrelid = c.oid AND a.attname = target.col AND NOT a.attisdropped
      )]::smallint[];

    IF NOT FOUND THEN
      RAISE NOTICE 'skip %.% (no FK to auth.users)', target.tbl, target.col;
      CONTINUE;
    END IF;

    -- SET NULL needs a nullable column. Widening is safe for existing rows and
    -- for every current INSERT, which all supply a value.
    IF target.deltype = 'n' AND v_attnotnull THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
                     target.tbl, target.col);
      RAISE NOTICE 'dropped NOT NULL on %.%', target.tbl, target.col;
    END IF;

    -- confdeltype is "char"; the VALUES literals resolve to text, so cast
    -- rather than rely on an operator that does not exist for that pair.
    IF v_confdeltype::text = target.deltype THEN
      RAISE NOTICE 'skip % (already correct)', v_conname;
      CONTINUE;
    END IF;

    v_action := CASE target.deltype WHEN 'c' THEN 'CASCADE' ELSE 'SET NULL' END;

    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', target.tbl, v_conname);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE %s',
      target.tbl, v_conname, target.col, v_action
    );

    RAISE NOTICE 'rebuilt % as ON DELETE %', v_conname, v_action;
  END LOOP;
END $$;

-- Document the non-obvious choices on the columns themselves, guarded the same
-- way as the block above so a missing table cannot abort the migration.
DO $$
BEGIN
  IF to_regclass('public.serp_requests_log') IS NOT NULL THEN
    COMMENT ON COLUMN public.serp_requests_log.user_id IS
      'Cascades on account deletion. The row''s `query` column contains the user''s own name/location, so the row cannot be anonymised by nulling this column; per-day spend is tracked separately in serp_usage_daily.';
  END IF;

  IF to_regclass('public.organization_invites') IS NOT NULL THEN
    COMMENT ON COLUMN public.organization_invites.invited_by IS
      'Nullable: set to NULL when the inviting user deletes their account, so the organization keeps the invite. Readers must tolerate NULL (send-org-invite falls back to "A team member").';
  END IF;

  IF to_regclass('public.org_scan_jobs') IS NOT NULL THEN
    COMMENT ON COLUMN public.org_scan_jobs.initiated_by IS
      'Nullable: set to NULL when the initiating user deletes their account, so the organization keeps the job record.';
  END IF;

  IF to_regclass('public.offboarding_reports') IS NOT NULL THEN
    COMMENT ON COLUMN public.offboarding_reports.generated_by IS
      'Nullable: set to NULL when the generating user deletes their account, so the organization keeps the compliance report.';
  END IF;
END $$;
