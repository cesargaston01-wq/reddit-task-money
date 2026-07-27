
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.email := OLD.email;
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM anon, authenticated;
UPDATE public.profiles p SET status = 'accepted'
WHERE status = 'pending' AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin');
