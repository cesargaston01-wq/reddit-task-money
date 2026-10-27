CREATE TABLE public.account_approval_email_log (
  user_id UUID NOT NULL PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_approval_email_log TO service_role;
ALTER TABLE public.account_approval_email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to approval email log" ON public.account_approval_email_log
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.notify_account_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT value INTO secret_value FROM public.internal_secrets WHERE name = 'digest_cron';
  IF secret_value IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := 'https://reddit-task-money.lovable.app/api/public/account-approved',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-digest-secret', secret_value),
    body := jsonb_build_object('user_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_account_approved ON public.profiles;
CREATE TRIGGER on_account_approved
AFTER UPDATE OF status ON public.profiles
FOR EACH ROW
WHEN (NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted')
EXECUTE FUNCTION public.notify_account_approved();