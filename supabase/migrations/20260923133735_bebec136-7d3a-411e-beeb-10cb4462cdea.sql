CREATE OR REPLACE FUNCTION public.reserve_mission(_mission_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _until timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'accepted'::public.account_status) THEN
    RAISE EXCEPTION 'Your account is not verified yet';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.mission_id = _mission_id AND s.user_id = auth.uid() AND s.status = 'rejected'::public.submission_status
  ) THEN
    RAISE EXCEPTION 'You can no longer take this mission: your submission was rejected';
  END IF;

  _until := now() + interval '10 minutes';

  UPDATE public.missions m
  SET reserved_by = auth.uid(), reserved_until = _until
  WHERE m.id = _mission_id
    AND m.is_active
    AND NOT m.is_locked
    AND (m.reserved_until IS NULL OR m.reserved_until < now() OR m.reserved_by = auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This mission was just reserved by another member.';
  END IF;

  RETURN _until;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_mission(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_mission(uuid) TO authenticated;