ALTER TABLE public.mission_digest_log
  ADD COLUMN IF NOT EXISTS mission_ids uuid[],
  ADD COLUMN IF NOT EXISTS wave2_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS wave2_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS wave2_recipient_count integer;

CREATE OR REPLACE FUNCTION public.run_mission_digest_wave2()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE secret_value text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.mission_digest_log WHERE wave2_due_at <= now() AND wave2_sent_at IS NULL) THEN
    RETURN;
  END IF;
  SELECT value INTO secret_value FROM public.internal_secrets WHERE name = 'digest_cron';
  IF secret_value IS NULL THEN RETURN; END IF;
  PERFORM net.http_post(
    url := 'https://reddit-task-money.lovable.app/api/public/mission-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-digest-secret', secret_value),
    body := '{}'::jsonb
  );
END; $$;
REVOKE ALL ON FUNCTION public.run_mission_digest_wave2() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('mission-digest-wave2', '0 * * * *', 'SELECT public.run_mission_digest_wave2();');