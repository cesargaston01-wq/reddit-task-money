CREATE OR REPLACE FUNCTION public.reserve_mission(_mission_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_reserved_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mission_payout numeric;
  m_type public.mission_type;
  used_today integer;
  daily_limit integer;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Authentication required or invalid submission owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.mission_id = NEW.mission_id
      AND s.user_id = auth.uid()
      AND s.status = 'rejected'::public.submission_status
  ) THEN
    RAISE EXCEPTION 'You cannot submit this mission again after it was rejected';
  END IF;

  SELECT m.payout, m.type
  INTO mission_payout, m_type
  FROM public.missions m
  WHERE m.id = NEW.mission_id
    AND m.is_active
    AND NOT m.is_locked
    AND m.reserved_by = auth.uid()
    AND m.reserved_until IS NOT NULL
    AND m.reserved_until >= now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission reservation is missing or expired';
  END IF;

  daily_limit := 1;

  SELECT count(*)
  INTO used_today
  FROM public.submissions s
  JOIN public.missions m2 ON m2.id = s.mission_id
  WHERE s.user_id = auth.uid()
    AND m2.type = m_type
    AND s.status <> 'rejected'::public.submission_status
    AND s.created_at >= date_trunc('day', now());

  IF used_today >= daily_limit THEN
    RAISE EXCEPTION 'Daily limit reached for % missions (% per day)', m_type, daily_limit;
  END IF;

  NEW.user_id := auth.uid();
  NEW.amount := mission_payout;
  RETURN NEW;
END;
$function$;