
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_accepted(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mission_is_locked(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM anon, authenticated;
