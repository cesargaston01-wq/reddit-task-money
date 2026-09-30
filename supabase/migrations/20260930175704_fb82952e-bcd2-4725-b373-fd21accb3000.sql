CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.mission_digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz NOT NULL DEFAULT now(),
  mission_count int NOT NULL,
  recipient_count int NOT NULL
);
GRANT ALL ON public.mission_digest_log TO service_role;
ALTER TABLE public.mission_digest_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.internal_secrets (
  name text PRIMARY KEY,
  value text NOT NULL
);
GRANT ALL ON public.internal_secrets TO service_role;
ALTER TABLE public.internal_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_secrets(name, value)
VALUES ('digest_cron', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

SELECT cron.schedule(
  'daily-mission-digest',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--5b72e116-738f-4e52-9abc-1d0bf77410fa.lovable.app/api/public/mission-digest',
    headers := jsonb_build_object('Content-Type','application/json','x-digest-secret',(SELECT value FROM public.internal_secrets WHERE name='digest_cron')),
    body := '{}'::jsonb
  );
  $$
);