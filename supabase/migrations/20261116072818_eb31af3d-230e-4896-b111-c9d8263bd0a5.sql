CREATE TABLE public.broker_removal_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES public.broker_removal_requests(id) ON DELETE CASCADE,
 attempt integer NOT NULL, status text NOT NULL DEFAULT 'pending', available_at timestamptz NOT NULL DEFAULT now(),
 lease_token uuid, lease_until timestamptz, delivery_started_at timestamptz, payload jsonb, provider_id text,
 failure_count integer NOT NULL DEFAULT 0, last_error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(request_id,attempt)
);
GRANT SELECT ON public.broker_removal_jobs TO authenticated;
GRANT ALL ON public.broker_removal_jobs TO service_role;
ALTER TABLE public.broker_removal_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view delivery jobs" ON public.broker_removal_jobs FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_broker_removal_jobs_updated_at BEFORE UPDATE ON public.broker_removal_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX broker_removal_jobs_due_idx ON public.broker_removal_jobs(available_at,id) WHERE status IN ('pending','running');
CREATE INDEX broker_removal_requests_status_due_idx ON public.broker_removal_requests(status,follow_up_at);
CREATE TABLE public.broker_removal_worker_state (
 singleton boolean PRIMARY KEY DEFAULT true, lease_token uuid, lease_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.broker_removal_worker_state TO service_role;
ALTER TABLE public.broker_removal_worker_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal service manages worker lease" ON public.broker_removal_worker_state FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE TRIGGER update_broker_removal_worker_state_updated_at BEFORE UPDATE ON public.broker_removal_worker_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.broker_removal_worker_state(singleton) VALUES(true);
CREATE OR REPLACE FUNCTION public.prepare_broker_removal_batch(p_limit integer DEFAULT 100) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_added integer; v_proof integer;
BEGIN
 IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'not authorized'; END IF;
 IF p_limit < 1 OR p_limit > 200 THEN RAISE EXCEPTION 'invalid batch size'; END IF;
 WITH candidates AS (
 SELECT r.id FROM broker_removal_requests r JOIN broker_scan_results s ON s.user_id=r.user_id AND s.broker_id=r.broker_id
 WHERE r.status IN ('request_sent','waiting') AND s.status_v2='not_found' AND s.scanned_at>r.sent_at ORDER BY r.id LIMIT p_limit
 ) UPDATE broker_removal_requests r SET status='removed',removed_at=now() FROM candidates c WHERE r.id=c.id;
 GET DIAGNOSTICS v_proof=ROW_COUNT;
 INSERT INTO broker_removal_requests(user_id,broker_id,scan_result_id,method,listing_url,status)
 SELECT s.user_id,s.broker_id,s.id,CASE WHEN b.privacy_email IS NOT NULL AND b.contact_verified_at IS NOT NULL AND b.removal_method IN ('email','both') THEN 'email' ELSE 'form' END,
 coalesce(s.evidence_url,s.profile_url),'found'
 FROM broker_scan_results s JOIN data_brokers b ON b.id=s.broker_id
 WHERE s.status_v2='found' AND EXISTS(SELECT 1 FROM subscriptions t WHERE t.user_id=s.user_id AND t.tier='complete' AND t.status IN ('active','trialing'))
 AND EXISTS(SELECT 1 FROM user_authorizations a WHERE a.user_id=s.user_id AND a.revoked_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM broker_removal_requests r WHERE r.user_id=s.user_id AND r.broker_id=s.broker_id)
 ORDER BY s.id LIMIT p_limit ON CONFLICT(user_id,broker_id) DO NOTHING;
 GET DIAGNOSTICS v_added=ROW_COUNT;
 INSERT INTO broker_removal_jobs(request_id,attempt,available_at)
 SELECT r.id,coalesce(r.attempts,0)+1,CASE WHEN r.status='found' THEN now() ELSE r.follow_up_at END
 FROM broker_removal_requests r
 WHERE r.method='email' AND coalesce(r.attempts,0)<3 AND (r.status='found' OR (r.status IN ('request_sent','waiting') AND r.follow_up_at IS NOT NULL))
 AND NOT EXISTS(SELECT 1 FROM broker_removal_jobs j WHERE j.request_id=r.id AND j.attempt=coalesce(r.attempts,0)+1)
 ORDER BY r.id LIMIT p_limit ON CONFLICT(request_id,attempt) DO NOTHING;
 RETURN jsonb_build_object('queued',v_added,'removed',v_proof);
END $$;
REVOKE ALL ON FUNCTION public.prepare_broker_removal_batch(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_broker_removal_batch(integer) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_broker_removal_jobs(p_token uuid,p_limit integer DEFAULT 5) RETURNS SETOF public.broker_removal_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'not authorized'; END IF;
 IF p_limit<1 OR p_limit>5 THEN RAISE EXCEPTION 'invalid batch size'; END IF;
 UPDATE broker_removal_worker_state SET lease_token=p_token,lease_until=now()+interval '2 minutes' WHERE singleton=true AND (lease_until IS NULL OR lease_until<now());
 IF NOT FOUND THEN RETURN; END IF;
 RETURN QUERY WITH due AS (
 SELECT id FROM broker_removal_jobs WHERE available_at<=now() AND (status='pending' OR (status='running' AND lease_until<now()))
 ORDER BY available_at,id LIMIT p_limit FOR UPDATE SKIP LOCKED
 ) UPDATE broker_removal_jobs j SET status='running',lease_token=p_token,lease_until=now()+interval '2 minutes' FROM due WHERE j.id=due.id RETURNING j.*;
END $$;
REVOKE ALL ON FUNCTION public.claim_broker_removal_jobs(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_broker_removal_jobs(uuid,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.guard_confirmed_broker_removal() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status='removed' AND OLD.status IS DISTINCT FROM 'removed' AND NOT EXISTS(
 SELECT 1 FROM broker_scan_results s WHERE s.user_id=NEW.user_id AND s.broker_id=NEW.broker_id AND s.status_v2='not_found' AND s.scanned_at>NEW.sent_at
 ) THEN RAISE EXCEPTION 'A successful scan after submission is required to confirm removal'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_confirmed_broker_removal BEFORE UPDATE ON public.broker_removal_requests FOR EACH ROW EXECUTE FUNCTION public.guard_confirmed_broker_removal();