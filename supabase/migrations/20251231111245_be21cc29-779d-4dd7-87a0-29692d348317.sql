-- 1. Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_pending_request UNIQUE (from_user_id, to_user_id)
);

-- 2. Create friendships table (bidirectional)
CREATE TABLE IF NOT EXISTS public.friendships (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('friend_request', 'battle_invite', 'achievement', 'system')),
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create battle_questions table for consistent questions in PvP
CREATE TABLE IF NOT EXISTS public.battle_questions (
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES public.questions(id),
  order_index INTEGER NOT NULL,
  PRIMARY KEY (battle_id, question_id)
);

-- 5. Add missing columns to battles table
ALTER TABLE public.battles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- 6. Add ready column to battle_participants
ALTER TABLE public.battle_participants
ADD COLUMN IF NOT EXISTS ready BOOLEAN DEFAULT false;

-- 7. Enable RLS on new tables
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_questions ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for friend_requests
CREATE POLICY "Users can view their friend requests"
ON public.friend_requests FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests they received"
ON public.friend_requests FOR UPDATE
USING (auth.uid() = to_user_id);

-- 9. RLS policies for friendships
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "System can manage friendships"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- 10. RLS policies for notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- 11. RLS policies for battle_questions
CREATE POLICY "Battle questions viewable by participants"
ON public.battle_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.battle_participants bp 
  WHERE bp.battle_id = battle_questions.battle_id 
  AND bp.user_id = auth.uid()
));

-- 12. Create function to increment user points (for quiz completion)
CREATE OR REPLACE FUNCTION public.increment_user_points(
  p_user_id UUID,
  p_points_to_add INTEGER,
  p_weekly_points_to_add INTEGER,
  p_increment_quizzes INTEGER
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_points = COALESCE(total_points, 0) + p_points_to_add,
    weekly_points = COALESCE(weekly_points, 0) + p_weekly_points_to_add,
    total_quizzes_completed = COALESCE(total_quizzes_completed, 0) + p_increment_quizzes,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- 13. Create/replace function to update leaderboard when profile points change
CREATE OR REPLACE FUNCTION public.sync_leaderboard_on_points_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert all_time leaderboard entry
  INSERT INTO public.leaderboard_entries (profile_id, period, subject, points, updated_at)
  VALUES (NEW.id, 'all_time', NULL, COALESCE(NEW.total_points, 0), NOW())
  ON CONFLICT (profile_id, period, subject) 
  DO UPDATE SET 
    points = COALESCE(NEW.total_points, 0),
    updated_at = NOW();
  
  -- Upsert weekly leaderboard entry
  INSERT INTO public.leaderboard_entries (profile_id, period, subject, points, updated_at)
  VALUES (NEW.id, 'weekly', NULL, COALESCE(NEW.weekly_points, 0), NOW())
  ON CONFLICT (profile_id, period, subject) 
  DO UPDATE SET 
    points = COALESCE(NEW.weekly_points, 0),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;

-- 14. Create trigger for leaderboard sync
DROP TRIGGER IF EXISTS sync_leaderboard_trigger ON public.profiles;
CREATE TRIGGER sync_leaderboard_trigger
  AFTER INSERT OR UPDATE OF total_points, weekly_points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_leaderboard_on_points_change();

-- 15. Create function to recalculate all ranks (can be called periodically)
CREATE OR REPLACE FUNCTION public.recalculate_leaderboard_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all_time ranks
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC NULLS LAST) as new_rank
    FROM public.leaderboard_entries
    WHERE period = 'all_time' AND subject IS NULL
  )
  UPDATE public.leaderboard_entries le
  SET rank = r.new_rank
  FROM ranked r
  WHERE le.id = r.id;
  
  -- Update weekly ranks
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC NULLS LAST) as new_rank
    FROM public.leaderboard_entries
    WHERE period = 'weekly' AND subject IS NULL
  )
  UPDATE public.leaderboard_entries le
  SET rank = r.new_rank
  FROM ranked r
  WHERE le.id = r.id;
END;
$$;