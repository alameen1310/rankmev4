DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create scoped notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR (
    type = 'battle_invite'
    AND NULLIF(data->>'inviter_id', '')::uuid = auth.uid()
  )
);