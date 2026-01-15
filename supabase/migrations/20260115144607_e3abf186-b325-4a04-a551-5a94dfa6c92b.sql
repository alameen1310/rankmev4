-- Add showcase_badges and equipped_title columns to profiles table for public display
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS showcase_badges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipped_title text DEFAULT NULL;

-- Create index for faster lookups when fetching profiles with badges
CREATE INDEX IF NOT EXISTS idx_profiles_showcase_badges ON public.profiles USING GIN(showcase_badges);

-- Add comment explaining the columns
COMMENT ON COLUMN public.profiles.showcase_badges IS 'Array of up to 3 badge IDs that the user wants to publicly showcase';
COMMENT ON COLUMN public.profiles.equipped_title IS 'The title ID that the user has equipped to display publicly';