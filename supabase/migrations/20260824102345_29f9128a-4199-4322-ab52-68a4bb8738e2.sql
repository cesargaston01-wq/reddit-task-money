DROP VIEW IF EXISTS public.public_missions;

CREATE OR REPLACE FUNCTION public.list_public_missions()
RETURNS TABLE (
  id uuid,
  type public.mission_type,
  title text,
  subreddit text,
  community_url text,
  payout numeric,
  is_active boolean,
  is_locked boolean,
  created_at timestamptz,
  reserved_until timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.type, m.title, m.subreddit, m.community_url, m.payout,
         m.is_active, m.is_locked, m.created_at, m.reserved_until
  FROM public.missions m
  WHERE m.is_active
    AND NOT m.is_locked
    AND (m.reserved_until IS NULL OR m.reserved_until < now())
  ORDER BY m.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_public_missions() FROM public;
GRANT EXECUTE ON FUNCTION public.list_public_missions() TO anon, authenticated;