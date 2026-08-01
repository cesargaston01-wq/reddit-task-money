-- 1) Anonymous visitors: only non-sensitive columns readable
REVOKE SELECT (post_title, post_body, flair, instructions, target_post_url, comment_text) ON public.missions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.missions FROM anon;

-- 2) Harden worker reservation updates
CREATE OR REPLACE FUNCTION public.protect_worker_mission_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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

  -- Non-admins may only change reservation fields
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.subreddit IS DISTINCT FROM OLD.subreddit
    OR NEW.community_url IS DISTINCT FROM OLD.community_url
    OR NEW.target_post_url IS DISTINCT FROM OLD.target_post_url
    OR NEW.post_title IS DISTINCT FROM OLD.post_title
    OR NEW.post_body IS DISTINCT FROM OLD.post_body
    OR NEW.comment_text IS DISTINCT FROM OLD.comment_text
    OR NEW.flair IS DISTINCT FROM OLD.flair
    OR NEW.instructions IS DISTINCT FROM OLD.instructions
    OR NEW.payout IS DISTINCT FROM OLD.payout
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.is_locked IS DISTINCT FROM OLD.is_locked
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only reservation fields can be changed';
  END IF;

  -- Reservation fields must either be cleared by the current holder,
  -- or claimed by the caller for at most 10 minutes
  IF NEW.reserved_by IS NULL THEN
    IF NEW.reserved_until IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid reservation state';
    END IF;
    IF OLD.reserved_by IS NOT NULL AND OLD.reserved_by <> auth.uid() AND OLD.reserved_until >= now() THEN
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
    IF OLD.reserved_by IS NOT NULL AND OLD.reserved_by <> auth.uid() AND OLD.reserved_until >= now() THEN
      RAISE EXCEPTION 'Mission is already reserved';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;