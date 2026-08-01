-- missions: strip leftover privileges from anon, keep only safe-column SELECT
REVOKE ALL ON public.missions FROM anon;
GRANT SELECT (id, type, title, subreddit, community_url, payout, is_active, is_locked, created_at, reserved_until) ON public.missions TO anon;

-- user_roles: no anon access at all; authenticated may only read
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;