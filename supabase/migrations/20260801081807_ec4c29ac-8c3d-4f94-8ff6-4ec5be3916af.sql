CREATE OR REPLACE FUNCTION public.sync_mission_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _mid uuid; _approved boolean;
BEGIN
  _mid := COALESCE(NEW.mission_id, OLD.mission_id);
  SELECT EXISTS (SELECT 1 FROM public.submissions s WHERE s.mission_id = _mid AND s.status = 'approved') INTO _approved;
  UPDATE public.missions m
    SET is_locked = EXISTS (
      SELECT 1 FROM public.submissions s WHERE s.mission_id = _mid AND s.status <> 'rejected'
    ),
    is_active = CASE WHEN _approved THEN false ELSE m.is_active END,
    reserved_by = NULL,
    reserved_until = NULL
  WHERE m.id = _mid;
  RETURN COALESCE(NEW, OLD);
END; $function$;

DROP TRIGGER IF EXISTS submissions_sync_mission_locked ON public.submissions;
CREATE TRIGGER submissions_sync_mission_locked
AFTER INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_locked();