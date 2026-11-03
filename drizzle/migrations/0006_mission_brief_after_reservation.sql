CREATE OR REPLACE FUNCTION public.get_mission_brief(_mission_id uuid)
RETURNS TABLE(
  community_url text,
  target_post_url text,
  comment_text text,
  post_title text,
  post_body text,
  flair text,
  instructions text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) AND NOT EXISTS (
    SELECT 1 FROM public.missions m
    WHERE m.id = _mission_id
      AND m.is_active
      AND NOT m.is_locked
      AND m.reserved_by = auth.uid()
      AND m.reserved_until IS NOT NULL
      AND m.reserved_until > now()
  ) THEN
    RAISE EXCEPTION 'Reserve this mission to unlock the link and the comment';
  END IF;

  RETURN QUERY
  SELECT m.community_url, m.target_post_url, m.comment_text, m.post_title, m.post_body, m.flair, m.instructions
  FROM public.missions m
  WHERE m.id = _mission_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_mission_brief(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mission_brief(uuid) TO authenticated;