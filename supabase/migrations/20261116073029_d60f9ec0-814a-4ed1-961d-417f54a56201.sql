CREATE OR REPLACE FUNCTION public.arm_broker_removal_retry() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_time timestamptz; v_job bigint; v_schedule text;
BEGIN
 SELECT min(CASE WHEN status='running' THEN greatest(lease_until,now()+interval '1 minute') ELSE greatest(available_at,now()+interval '1 minute') END) INTO v_time FROM broker_removal_jobs WHERE status IN ('pending','running');
 SELECT jobid INTO v_job FROM cron.job WHERE jobname='broker-removal-queue-retry';
 IF v_time IS NULL THEN IF v_job IS NOT NULL THEN PERFORM cron.unschedule(v_job); END IF; RETURN; END IF;
 v_schedule=to_char(v_time AT TIME ZONE 'UTC','MI HH24 DD MM')||' *';
 IF v_job IS NOT NULL THEN PERFORM cron.unschedule(v_job); END IF;
 PERFORM cron.schedule('broker-removal-queue-retry',v_schedule,'SELECT public.wake_broker_removal_worker(''worker'');');
END $$;
REVOKE ALL ON FUNCTION public.arm_broker_removal_retry() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.arm_broker_removal_retry() TO service_role;
CREATE OR REPLACE FUNCTION public.removal_job_enqueued() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM broker_removal_jobs WHERE status='pending' AND available_at<=now()) THEN PERFORM wake_broker_removal_worker('worker'); END IF;
 PERFORM arm_broker_removal_retry(); RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.removal_job_enqueued() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER removal_job_enqueued AFTER INSERT ON public.broker_removal_jobs FOR EACH STATEMENT EXECUTE FUNCTION public.removal_job_enqueued();
CREATE OR REPLACE FUNCTION public.removal_source_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM wake_broker_removal_worker('prepare'); RETURN NULL; END $$;
REVOKE ALL ON FUNCTION public.removal_source_changed() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER removal_scan_changed AFTER INSERT OR UPDATE ON public.broker_scan_results FOR EACH STATEMENT EXECUTE FUNCTION public.removal_source_changed();
CREATE TRIGGER removal_subscription_changed AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH STATEMENT EXECUTE FUNCTION public.removal_source_changed();
CREATE TRIGGER removal_authorization_changed AFTER INSERT OR UPDATE ON public.user_authorizations FOR EACH STATEMENT EXECUTE FUNCTION public.removal_source_changed();
CREATE OR REPLACE FUNCTION public.validate_removal_job() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status NOT IN ('pending','running','sent','cancelled','failed') OR NEW.attempt<1 OR NEW.attempt>3 OR NEW.failure_count<0 THEN RAISE EXCEPTION 'Invalid removal delivery state'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_removal_job BEFORE INSERT OR UPDATE ON public.broker_removal_jobs FOR EACH ROW EXECUTE FUNCTION public.validate_removal_job();