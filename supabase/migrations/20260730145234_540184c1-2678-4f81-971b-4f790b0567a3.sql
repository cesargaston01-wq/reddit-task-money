REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_accepted(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mission_is_locked(uuid) FROM PUBLIC, anon, authenticated;