-- Make user_identifiers.verified mean something, and mark verified the identifiers we can
-- already prove belong to their owner.
--
-- WHAT THE HOLE WAS
-- send-deletion-request loaded the caller's chosen user_identifiers row filtered on id +
-- user_id only -- it never looked at `verified` -- and then mailed that value to a real
-- company, from our domain, as a formal deletion demand naming the person it identifies.
-- AddIdentifierDialog inserts whatever the user typed with verified = false, so the product
-- could be pointed at a third party: type a stranger's name, email or postal address and we
-- send a legal demand about them with our envelope on it.
--
-- The edge function now refuses any identifier that is neither verified nor equal to the
-- address on the caller's access token. This migration is what keeps that gate from being
-- either useless or an outage:
--
-- 1. THE FLAG WAS CLIENT-WRITABLE, so gating on it was decorative. The "Users can update
--    their own identifiers" policy from 20251106201559 has no column restriction, so any
--    signed-in user could PATCH user_identifiers?id=eq... with {"verified": true} straight
--    from the browser and walk through the new check. Worse, they could verify a row by
--    using their own address and then edit `value` to a stranger's, keeping the flag. The
--    trigger below takes the column out of the client's hands: it is DERIVED, never
--    accepted, and editing `value` costs the row its flag.
--
-- 2. NOTHING HAS EVER SET IT TRUE. Every write in the codebase inserts verified = false;
--    the only true rows anywhere came from the one-off backfill in 20251106201559. Without
--    the backfill below, existing users who added their own email address through the
--    dialog would hit the new gate on the identifier they have always used.
--
-- WHAT IS TRUSTED HERE
-- auth.users.email, the address Supabase authenticates the user with, and nothing else.
-- Deliberately NOT public.profiles.email: that row is user-writable too ("Users can update
-- their own profile", likewise unrestricted), so deriving trust from it would let someone
-- set profiles.email to a victim's address, add a matching identifier and have us stamp it
-- verified. Verification may only ever come from something the user cannot forge.
--
-- WHAT THIS DOES NOT DO
-- It marks nothing else verified. Postal addresses, phone numbers, usernames and secondary
-- email addresses stay false and stay refused by the edge function, because we hold no
-- evidence for them -- and they are precisely the values the hole was dangerous for. There
-- is no in-product way to verify them yet; until there is, the account email is the only
-- identifier a deletion request can name.
--
-- IDEMPOTENT: the backfill only flips false -> true and matches on the current flag, and the
-- trigger is created with a stable name, so a re-run is a no-op.

-- 1. Backfill: an identifier whose value IS the owner's authentication address is theirs by
--    definition. Case- and whitespace-insensitive, because addresses are stored exactly as
--    typed; loosening the match here can only ever widen to the same address the user signs
--    in with, never to a different one.
--
--    Matched on value alone, not on type = 'email', so this rule stays identical to the one
--    the trigger and the edge function apply. In practice only email rows can match anyway.
UPDATE public.user_identifiers ui
SET verified = true
FROM auth.users au
WHERE ui.user_id = au.id
  AND ui.verified IS FALSE
  AND btrim(coalesce(au.email, '')) <> ''
  AND lower(btrim(ui.value)) = lower(btrim(au.email));

-- 2. Derive the flag on every write from here on, so it stops being something a client can
--    assert about itself.
--
--    SECURITY DEFINER because auth.users is not readable by the `authenticated` role; the
--    function only ever reads one row by primary key and returns no data, so it exposes
--    nothing beyond the boolean it computes.
--
--    Note it derives the flag for ALL writers, service_role included. Nothing in the
--    codebase sets `verified`, so that breaks no caller today, and a future real
--    verification flow (confirming a secondary address by emailing it a token) should be
--    taught to this function rather than allowed to bypass it.
CREATE OR REPLACE FUNCTION public.derive_user_identifier_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_email TEXT;
BEGIN
  SELECT lower(btrim(au.email)) INTO v_auth_email
  FROM auth.users au
  WHERE au.id = NEW.user_id;

  -- Provably the owner's: the value IS the address they authenticate with.
  IF v_auth_email IS NOT NULL
     AND v_auth_email <> ''
     AND lower(btrim(NEW.value)) = v_auth_email THEN
    NEW.verified := true;
    RETURN NEW;
  END IF;

  -- Otherwise the flag is not the writer's to set, so it can only be carried over from what
  -- the row already held -- and only while the row still says the same thing it said when
  -- it earned it. Editing `value` (or reassigning the row) re-opens the question and drops
  -- it back to false. This is what preserves the legacy rows from 20251106201559 and
  -- whatever a future verification flow records, while blocking verify-then-swap.
  IF TG_OP = 'UPDATE'
     AND OLD.verified IS TRUE
     AND NEW.user_id = OLD.user_id
     AND lower(btrim(NEW.value)) = lower(btrim(OLD.value)) THEN
    NEW.verified := true;
    RETURN NEW;
  END IF;

  -- Explicit false rather than leaving NEW.verified alone: the column is NOT NULL and this
  -- is the branch a client-supplied `true` has to land in.
  NEW.verified := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS derive_user_identifiers_verification ON public.user_identifiers;

CREATE TRIGGER derive_user_identifiers_verification
  BEFORE INSERT OR UPDATE ON public.user_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.derive_user_identifier_verification();
