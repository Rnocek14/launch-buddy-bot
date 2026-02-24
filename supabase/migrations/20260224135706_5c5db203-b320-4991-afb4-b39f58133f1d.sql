-- Restrict authenticated users from reading sensitive token columns on email_connections.
-- Only allow SELECT on safe columns; edge functions use service_role which bypasses RLS/grants.

REVOKE SELECT ON public.email_connections FROM authenticated;

GRANT SELECT (
  id, user_id, email, provider, is_primary, account_label,
  token_expires_at, tokens_encrypted, created_at, updated_at, provider_user_id
) ON public.email_connections TO authenticated;