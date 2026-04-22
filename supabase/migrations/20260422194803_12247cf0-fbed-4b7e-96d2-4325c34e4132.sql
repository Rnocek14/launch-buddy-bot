-- Fix missing SELECT privilege on email_connections for authenticated role
-- Without this, dashboard queries throw "permission denied for table email_connections"
GRANT SELECT ON public.email_connections TO authenticated;

-- Defensive: ensure all standard CRUD grants present on key user-owned tables
-- (RLS still enforces row-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_scans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exposure_scans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exposure_findings TO authenticated;