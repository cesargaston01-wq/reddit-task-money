CREATE TABLE public.submission_rejection_email_log (
  submission_id UUID NOT NULL PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.submission_rejection_email_log TO service_role;
ALTER TABLE public.submission_rejection_email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to rejection email log" ON public.submission_rejection_email_log
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.notify_submission_rejected()
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
    url := 'https://reddit-task-money.lovable.app/api/public/submission-rejected',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-digest-secret', secret_value),
    body := jsonb_build_object('submission_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_submission_rejected ON public.submissions;
CREATE TRIGGER on_submission_rejected
AFTER UPDATE OF status ON public.submissions
FOR EACH ROW
WHEN (NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected')
EXECUTE FUNCTION public.notify_submission_rejected();