CREATE OR REPLACE FUNCTION public.protect_worker_mission_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  cur public.missions%ROWTYPE;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid() AND r.role = 'admin'::public.app_role
  ) THEN
    RETURN NEW;
  END IF;

  -- Re-read the row under a row lock so concurrent reservations are serialized
  -- and we compare against the latest committed state, not the statement snapshot.
  SELECT * INTO cur FROM public.missions m WHERE m.id = OLD.id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found';
  END IF;

  -- Non-admins may only change reservation fields
  IF NEW.id IS DISTINCT FROM cur.id
    OR NEW.type IS DISTINCT FROM cur.type
    OR NEW.title IS DISTINCT FROM cur.title
    OR NEW.subreddit IS DISTINCT FROM cur.subreddit
    OR NEW.community_url IS DISTINCT FROM cur.community_url
    OR NEW.target_post_url IS DISTINCT FROM cur.target_post_url
    OR NEW.post_title IS DISTINCT FROM cur.post_title
    OR NEW.post_body IS DISTINCT FROM cur.post_body
    OR NEW.comment_text IS DISTINCT FROM cur.comment_text
    OR NEW.flair IS DISTINCT FROM cur.flair
    OR NEW.instructions IS DISTINCT FROM cur.instructions
    OR NEW.payout IS DISTINCT FROM cur.payout
    OR NEW.is_active IS DISTINCT FROM cur.is_active
    OR NEW.is_locked IS DISTINCT FROM cur.is_locked
    OR NEW.created_at IS DISTINCT FROM cur.created_at
  THEN
    RAISE EXCEPTION 'Only reservation fields can be changed';
  END IF;

  IF NOT cur.is_active OR cur.is_locked THEN
    RAISE EXCEPTION 'Mission is not available';
  END IF;

  IF NEW.reserved_by IS NULL THEN
    IF NEW.reserved_until IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid reservation state';
    END IF;
    IF cur.reserved_by IS NOT NULL AND cur.reserved_by <> auth.uid() AND cur.reserved_until >= now() THEN
      RAISE EXCEPTION 'Mission is reserved by another user';
    END IF;
  ELSE
    IF NEW.reserved_by <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot reserve a mission for another user';
    END IF;
    IF NEW.reserved_until IS NULL
       OR NEW.reserved_until <= now()
       OR NEW.reserved_until > now() + interval '10 minutes 5 seconds' THEN
      RAISE EXCEPTION 'Invalid reservation window';
    END IF;
    IF cur.reserved_by IS NOT NULL AND cur.reserved_by <> auth.uid() AND cur.reserved_until >= now() THEN
      RAISE EXCEPTION 'Mission is already reserved';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;