-- Add admin policies for questions table (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert questions"
ON public.questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update questions"
ON public.questions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can delete questions"
ON public.questions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
);

-- Update admin_actions policies to also check user_roles
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
CREATE POLICY "Admins can insert admin actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
);

DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  )
);