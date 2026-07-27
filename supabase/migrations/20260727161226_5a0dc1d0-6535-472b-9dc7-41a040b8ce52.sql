
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.account_status AS ENUM ('pending','accepted','rejected');
CREATE TYPE public.mission_type AS ENUM ('post','comment');
CREATE TYPE public.submission_status AS ENUM ('pending','approved','rejected');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  reddit_profile_url text NOT NULL DEFAULT '',
  wallet_address text NOT NULL DEFAULT '',
  status public.account_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_accepted(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'accepted');
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- users may only change their wallet
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.email := OLD.email;
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protect_profile_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- signup handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_admin boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, reddit_profile_url, wallet_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'reddit_profile_url',''),
    COALESCE(NEW.raw_user_meta_data->>'wallet_address','')
  );
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') INTO has_admin;
  IF has_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    UPDATE public.profiles SET status = 'accepted' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MISSIONS
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.mission_type NOT NULL,
  title text NOT NULL,
  subreddit text NOT NULL,
  community_url text NOT NULL DEFAULT '',
  payout numeric(10,2) NOT NULL DEFAULT 5,
  estimated_minutes integer NOT NULL DEFAULT 10,
  difficulty text NOT NULL DEFAULT 'Facile',
  post_title text,
  post_body text,
  flair text,
  instructions text,
  target_post_url text,
  comment_text text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_url text NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'pending',
  admin_note text,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE UNIQUE INDEX submissions_one_active_per_mission
  ON public.submissions (mission_id) WHERE status <> 'rejected';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.mission_is_locked(_mission_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.submissions WHERE mission_id = _mission_id AND status <> 'rejected');
$$;

CREATE POLICY "workers browse open missions" ON public.missions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (public.is_accepted(auth.uid()) AND is_active AND NOT public.mission_is_locked(id))
    OR EXISTS (SELECT 1 FROM public.submissions s WHERE s.mission_id = missions.id AND s.user_id = auth.uid())
  );
CREATE POLICY "admins manage missions" ON public.missions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "read own submissions" ON public.submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "create own submissions" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_accepted(auth.uid()));
CREATE POLICY "admins manage submissions" ON public.submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
