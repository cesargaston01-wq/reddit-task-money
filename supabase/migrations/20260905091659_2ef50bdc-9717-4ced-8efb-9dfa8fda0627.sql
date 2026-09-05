CREATE OR REPLACE FUNCTION public.delete_member_account(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admins only.' USING ERRCODE = '42501';
  END IF;

  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account.' USING ERRCODE = '42501';
  END IF;

  IF public.has_role(_target_user_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'You cannot delete another admin account.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.missions
  SET reserved_by = NULL, reserved_until = NULL
  WHERE reserved_by = _target_user_id;

  DELETE FROM auth.users WHERE id = _target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member account not found.' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_member_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_member_account(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_member_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_member_account(uuid) TO service_role;