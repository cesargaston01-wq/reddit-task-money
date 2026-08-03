REVOKE SELECT ON public.missions FROM anon;
GRANT SELECT (id, type, title, subreddit, community_url, payout, is_active, is_locked, created_at, reserved_until) ON public.missions TO anon;