DROP POLICY IF EXISTS "create reserved mission submission" ON public.submissions;

CREATE POLICY "create own verified submission"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'accepted'::public.account_status
  )
);

CREATE OR REPLACE FUNCTION public.validate_reserved_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mission_payout numeric;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Authentication required or invalid submission owner';
  END IF;

  SELECT m.payout
  INTO mission_payout
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

  NEW.user_id := auth.uid();
  NEW.amount := mission_payout;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_reserved_submission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS validate_reserved_submission_before_insert ON public.submissions;
CREATE TRIGGER validate_reserved_submission_before_insert
BEFORE INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.validate_reserved_submission();

DROP TRIGGER IF EXISTS protect_worker_mission_updates_before_update ON public.missions;
CREATE TRIGGER protect_worker_mission_updates_before_update
BEFORE UPDATE ON public.missions
FOR EACH ROW
EXECUTE FUNCTION public.protect_worker_mission_updates();

DROP TRIGGER IF EXISTS sync_mission_locked_after_submission_change ON public.submissions;
CREATE TRIGGER sync_mission_locked_after_submission_change
AFTER INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.sync_mission_locked();