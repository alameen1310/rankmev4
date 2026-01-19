-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Create proper policies for payments table (only service role via edge functions can insert/update)
-- Since edge functions use service role key, they bypass RLS
-- Users can only SELECT their own payments