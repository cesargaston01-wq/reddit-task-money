REVOKE ALL ON FUNCTION public.delete_member_account(uuid) FROM authenticated;
DROP FUNCTION public.delete_member_account(uuid);

CREATE TABLE public.member_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL DEFAULT auth.uid(),
  target_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.member_deletion_requests TO authenticated;
GRANT ALL ON public.member_deletion_requests TO service_role;
ALTER TABLE public.member_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can request member deletion"
ON public.member_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND target_user_id <> auth.uid()
  AND NOT public.has_role(target_user_id, 'admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.process_member_deletion_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.requested_by IS DISTINCT FROM auth.uid()
     OR NOT public.has_role(NEW.requested_by, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admins only.' USING ERRCODE = '42501';
  END IF;

  IF NEW.target_user_id = NEW.requested_by THEN
    RAISE EXCEPTION 'You cannot delete your own account.' USING ERRCODE = '42501';
  END IF;

  IF public.has_role(NEW.target_user_id, 'admin'::public.app_role) THEN
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

CREATE TRIGGER process_member_deletion_request_trigger
BEFORE INSERT ON public.member_deletion_requests
FOR EACH ROW
EXECUTE FUNCTION public.process_member_deletion_request();