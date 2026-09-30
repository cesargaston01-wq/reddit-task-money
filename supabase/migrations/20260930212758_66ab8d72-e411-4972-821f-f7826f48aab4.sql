ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE, ADD COLUMN referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
UPDATE public.profiles SET referral_code = lower(substr(md5(id::text || random()::text),1,8)) WHERE referral_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT lower(substr(md5(gen_random_uuid()::text),1,8));
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.status := OLD.status; NEW.rejection_reason := OLD.rejection_reason;
    NEW.email := OLD.email; NEW.id := OLD.id; NEW.created_at := OLD.created_at;
    NEW.referral_code := OLD.referral_code; NEW.referred_by := OLD.referred_by;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE has_admin boolean; ref_id uuid;
BEGIN
  SELECT id INTO ref_id FROM public.profiles
   WHERE referral_code = lower(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code',''))) LIMIT 1;
  INSERT INTO public.profiles (id, full_name, email, reddit_profile_url, wallet_address, referred_by)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'reddit_profile_url',''), COALESCE(NEW.raw_user_meta_data->>'wallet_address',''), ref_id);
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') INTO has_admin;
  IF has_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    UPDATE public.profiles SET status = 'accepted' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

-- Referrer's own invitees (masked) with earnings
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE(username text, status account_status, joined_at timestamptz, approved_missions bigint, earned numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.full_name, p.status, p.created_at,
    (SELECT count(*) FROM submissions s WHERE s.user_id = p.id AND s.status='approved'),
    (CASE WHEN p.status='accepted' THEN 1 ELSE 0 END)
      + 0.5 * (SELECT count(*) FROM submissions s WHERE s.user_id = p.id AND s.status='approved')
  FROM profiles p WHERE p.referred_by = auth.uid() ORDER BY p.created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_referrals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_referrals() TO authenticated;

-- Admin overview: referral earnings per referrer
CREATE OR REPLACE FUNCTION public.admin_referral_earnings()
RETURNS TABLE(referrer_id uuid, username text, wallet text, invited bigint, validated bigint, approved_missions bigint, earned numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY
  SELECT r.id, r.full_name, r.wallet_address,
    count(p.id),
    count(p.id) FILTER (WHERE p.status='accepted'),
    COALESCE(sum((SELECT count(*) FROM submissions s WHERE s.user_id=p.id AND s.status='approved')),0)::bigint,
    count(p.id) FILTER (WHERE p.status='accepted') * 1.0
      + 0.5 * COALESCE(sum((SELECT count(*) FROM submissions s WHERE s.user_id=p.id AND s.status='approved')),0)
  FROM profiles r JOIN profiles p ON p.referred_by = r.id
  GROUP BY r.id, r.full_name, r.wallet_address ORDER BY 7 DESC;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_referral_earnings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_referral_earnings() TO authenticated;