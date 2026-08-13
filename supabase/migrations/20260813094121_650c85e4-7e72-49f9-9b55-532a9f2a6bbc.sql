CREATE TABLE public.admin_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_id, profile_id)
);

GRANT SELECT, INSERT, DELETE ON public.admin_favorites TO authenticated;
GRANT ALL ON public.admin_favorites TO service_role;

ALTER TABLE public.admin_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read own favorites" ON public.admin_favorites
FOR SELECT TO authenticated
USING (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'::public.app_role));

CREATE POLICY "admins add own favorites" ON public.admin_favorites
FOR INSERT TO authenticated
WITH CHECK (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'::public.app_role));

CREATE POLICY "admins remove own favorites" ON public.admin_favorites
FOR DELETE TO authenticated
USING (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'::public.app_role));