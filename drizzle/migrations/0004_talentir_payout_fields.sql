ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS talentir_payout_id text,
  ADD COLUMN IF NOT EXISTS talentir_status text,
  ADD COLUMN IF NOT EXISTS talentir_sent_at timestamptz;