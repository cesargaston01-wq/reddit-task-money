DROP POLICY IF EXISTS "public browse open missions" ON public.missions;

REVOKE SELECT ON public.missions FROM anon;
REVOKE SELECT (id, type, title, subreddit, community_url, payout, is_active, is_locked, created_at, reserved_until) ON public.missions FROM anon;

CREATE OR REPLACE VIEW public.public_missions
WITH (security_invoker = off) AS
SELECT m.id, m.type, m.title, m.subreddit, m.community_url, m.payout,
       m.is_active, m.is_locked, m.created_at, m.reserved_until
FROM public.missions m
WHERE m.is_active
  AND NOT m.is_locked
  AND (m.reserved_until IS NULL OR m.reserved_until < now());

GRANT SELECT ON public.public_missions TO anon, authenticated;