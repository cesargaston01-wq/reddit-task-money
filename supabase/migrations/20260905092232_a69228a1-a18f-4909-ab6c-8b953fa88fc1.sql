DROP POLICY IF EXISTS "Admins can request member deletion" ON public.member_deletion_requests;

CREATE POLICY "Admins can request member deletion"
ON public.member_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND target_user_id <> auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.user_roles requester_role
    WHERE requester_role.user_id = auth.uid()
      AND requester_role.role = 'admin'::public.app_role
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles target_role
    WHERE target_role.user_id = target_user_id
      AND target_role.role = 'admin'::public.app_role
  )
);

CREATE OR REPLACE FUNCTION public.process_member_deletion_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.requested_by IS DISTINCT FROM auth.uid()
     OR NOT EXISTS (
       SELECT 1
       FROM public.user_roles requester_role
       WHERE requester_role.user_id = auth.uid()
         AND requester_role.role = 'admin'::public.app_role
     ) THEN
    RAISE EXCEPTION 'Admins only.' USING ERRCODE = '42501';
  END IF;

  IF NEW.target_user_id = NEW.requested_by THEN
    RAISE EXCEPTION 'You cannot delete your own account.' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_roles target_role
    WHERE target_role.user_id = NEW.target_user_id
      AND target_role.role = 'admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'You cannot delete another admin account.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.missions
  SET reserved_by = NULL, reserved_until = NULL
  WHERE reserved_by = NEW.target_user_id;

  DELETE FROM auth.users WHERE id = NEW.target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member account not found.' USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.process_member_deletion_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_member_deletion_request() FROM anon;
REVOKE ALL ON FUNCTION public.process_member_deletion_request() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_member_deletion_request() TO service_role;