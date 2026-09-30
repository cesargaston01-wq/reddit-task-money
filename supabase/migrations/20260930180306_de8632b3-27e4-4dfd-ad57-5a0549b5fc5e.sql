-- Remove the old fixed-time daily digest job if it exists
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE command LIKE '%mission-digest%' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

-- Trigger: on each new mission, call the digest route (it enforces the 1-per-24h cap)
CREATE OR REPLACE FUNCTION public.notify_new_mission()
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
    url := 'https://reddit-task-money.lovable.app/api/public/mission-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-digest-secret', secret_value),
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_mission_published ON public.missions;
CREATE TRIGGER on_mission_published
AFTER INSERT ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_mission();