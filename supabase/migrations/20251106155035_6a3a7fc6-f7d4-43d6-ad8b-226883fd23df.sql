-- Create a function to send welcome email via edge function
-- This function is called by a trigger when a new waitlist entry is created
CREATE OR REPLACE FUNCTION public.send_welcome_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_secret text;
  request_id bigint;
BEGIN
  -- Get the EMAIL_SECRET from vault (you'll need to set this in Supabase secrets)
  email_secret := current_setting('app.settings.email_secret', true);
  
  -- Call the edge function with secret validation
  -- Using pg_net extension to make HTTP request
  SELECT net.http_post(
    url := 'https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-email-secret', COALESCE(email_secret, '')
    ),
    body := jsonb_build_object('email', NEW.email)
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on waitlist table
DROP TRIGGER IF EXISTS on_waitlist_insert_send_email ON public.waitlist;

CREATE TRIGGER on_waitlist_insert_send_email
  AFTER INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_trigger();