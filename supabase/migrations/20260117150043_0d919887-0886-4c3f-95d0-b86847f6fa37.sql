-- Add bank account details and avatar URL fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add index for faster admin user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_date DESC NULLS LAST);