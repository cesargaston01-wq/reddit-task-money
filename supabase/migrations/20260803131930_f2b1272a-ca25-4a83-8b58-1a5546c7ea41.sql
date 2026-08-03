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

  daily_limit := CASE WHEN m_type = 'post'::public.mission_type THEN 1 ELSE 3 END;

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