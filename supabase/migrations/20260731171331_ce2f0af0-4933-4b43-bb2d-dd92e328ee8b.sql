DROP POLICY IF EXISTS "create reserved mission submission" ON public.submissions;

CREATE POLICY "create reserved mission submission"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'accepted'::public.account_status
  )
  AND EXISTS (
    SELECT 1
    FROM public.missions m
    WHERE m.id = mission_id
      AND m.is_active
      AND NOT m.is_locked
      AND m.reserved_by = auth.uid()
      AND m.reserved_until IS NOT NULL
      AND m.reserved_until >= now()
      AND amount = m.payout
  )
);