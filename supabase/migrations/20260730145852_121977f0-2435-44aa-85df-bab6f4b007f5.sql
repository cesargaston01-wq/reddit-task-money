ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS reserved_by uuid,
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

CREATE INDEX IF NOT EXISTS missions_reserved_until_idx ON public.missions (reserved_until);

DROP POLICY IF EXISTS "public browse open missions" ON public.missions;
CREATE POLICY "public browse open missions" ON public.missions FOR SELECT TO anon
USING (is_active AND NOT is_locked AND (reserved_until IS NULL OR reserved_until < now()));

DROP POLICY IF EXISTS "workers browse open missions" ON public.missions;
CREATE POLICY "workers browse open missions" ON public.missions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  OR (
    is_active AND NOT is_locked
    AND (reserved_until IS NULL OR reserved_until < now() OR reserved_by = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'accepted')
  )
  OR EXISTS (SELECT 1 FROM public.submissions s WHERE s.mission_id = missions.id AND s.user_id = auth.uid())
);

-- clear reservation whenever a submission is created for the mission
CREATE OR REPLACE FUNCTION public.sync_mission_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _mid uuid;
BEGIN
  _mid := COALESCE(NEW.mission_id, OLD.mission_id);
  UPDATE public.missions m
    SET is_locked = EXISTS (
      SELECT 1 FROM public.submissions s WHERE s.mission_id = _mid AND s.status <> 'rejected'
    ),
    reserved_by = NULL,
    reserved_until = NULL
  WHERE m.id = _mid;
  RETURN COALESCE(NEW, OLD);
END; $$;

REVOKE ALL ON FUNCTION public.sync_mission_locked() FROM PUBLIC, anon, authenticated;