CREATE OR REPLACE FUNCTION public.protect_worker_mission_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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

  RETURN NEW;
END;
$$;