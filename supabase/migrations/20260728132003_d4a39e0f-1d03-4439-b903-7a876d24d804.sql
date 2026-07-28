GRANT SELECT ON public.missions TO anon;
GRANT EXECUTE ON FUNCTION public.mission_is_locked(uuid) TO anon;
CREATE POLICY "public browse open missions" ON public.missions FOR SELECT TO anon USING (is_active AND NOT public.mission_is_locked(id));