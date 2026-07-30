ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

UPDATE public.missions m SET is_locked = EXISTS (
  SELECT 1 FROM public.submissions s WHERE s.mission_id = m.id AND s.status <> 'rejected'
);

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
    )
  WHERE m.id = _mid;
  RETURN COALESCE(NEW, OLD);
END; $$;

REVOKE ALL ON FUNCTION public.sync_mission_locked() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS submissions_sync_mission_locked ON public.submissions;
CREATE TRIGGER submissions_sync_mission_locked
AFTER INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_locked();

-- Rewrite policies to avoid calling helper functions
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "read own profile" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "admins update profiles" ON public.profiles;
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "workers browse open missions" ON public.missions;
CREATE POLICY "workers browse open missions" ON public.missions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  OR (is_active AND NOT is_locked AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'accepted'))
  OR EXISTS (SELECT 1 FROM public.submissions s WHERE s.mission_id = missions.id AND s.user_id = auth.uid())
);

DROP POLICY IF EXISTS "admins manage missions" ON public.missions;
CREATE POLICY "admins manage missions" ON public.missions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "public browse open missions" ON public.missions;
CREATE POLICY "public browse open missions" ON public.missions FOR SELECT TO anon
USING (is_active AND NOT is_locked);

DROP POLICY IF EXISTS "read own submissions" ON public.submissions;
CREATE POLICY "read own submissions" ON public.submissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP POLICY IF EXISTS "create own submissions" ON public.submissions;
CREATE POLICY "create own submissions" ON public.submissions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.status = 'accepted'));

DROP POLICY IF EXISTS "admins manage submissions" ON public.submissions;
CREATE POLICY "admins manage submissions" ON public.submissions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

DROP FUNCTION IF EXISTS public.mission_is_locked(uuid);