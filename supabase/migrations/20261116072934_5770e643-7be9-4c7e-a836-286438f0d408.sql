CREATE TABLE public.broker_removal_callbacks(token uuid PRIMARY KEY DEFAULT gen_random_uuid(), mode text NOT NULL, expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.broker_removal_callbacks TO service_role;
ALTER TABLE public.broker_removal_callbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal callbacks only" ON public.broker_removal_callbacks FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE TRIGGER update_removal_callbacks_updated_at BEFORE UPDATE ON public.broker_removal_callbacks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.consume_removal_callback(p_token uuid,p_mode text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'not authorized'; END IF;
 DELETE FROM broker_removal_callbacks WHERE token=p_token AND mode=p_mode AND expires_at>now();
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.consume_removal_callback(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_removal_callback(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.wake_broker_removal_worker(p_mode text DEFAULT 'worker') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_token uuid; v_function text;
BEGIN
 IF p_mode NOT IN ('worker','prepare','report') THEN RAISE EXCEPTION 'invalid mode'; END IF;
 DELETE FROM broker_removal_callbacks WHERE expires_at<now();
 INSERT INTO broker_removal_callbacks(mode) VALUES(p_mode) RETURNING token INTO v_token;
 v_function=CASE p_mode WHEN 'worker' THEN 'process-broker-removals' WHEN 'report' THEN 'send-monthly-discovery-report' ELSE 'send-broker-removals' END;
 PERFORM net.http_post(url:='https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/'||v_function,
 headers:=jsonb_build_object('Content-Type','application/json','apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeGtlZXprYWpraXlqcG5qZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM4NDYsImV4cCI6MjA3NzkzOTg0Nn0.64_sr6feszswWrxHBogLYLPZvlnibTY_7ZOFd1l1Vfw','x-removal-callback',v_token::text),body:='{}'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.wake_broker_removal_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wake_broker_removal_worker(text) TO service_role;
CREATE OR REPLACE FUNCTION public.finish_broker_removal_job(p_id uuid,p_token uuid,p_provider_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j broker_removal_jobs;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'not authorized'; END IF;
 SELECT * INTO j FROM broker_removal_jobs WHERE id=p_id AND lease_token=p_token AND status='running' AND lease_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE broker_removal_requests SET status='request_sent',sent_at=now(),follow_up_at=now()+interval '30 days',attempts=j.attempt,last_error=NULL WHERE id=j.request_id;
 UPDATE broker_removal_jobs SET status='sent',provider_id=p_provider_id,last_error=NULL,lease_until=NULL WHERE id=j.id;
 INSERT INTO broker_removal_jobs(request_id,attempt,available_at) SELECT j.request_id,j.attempt+1,now()+interval '30 days' WHERE j.attempt<3 ON CONFLICT(request_id,attempt) DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.finish_broker_removal_job(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_broker_removal_job(uuid,uuid,text) TO service_role;