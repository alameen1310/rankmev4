-- 1. SUBJECTS TABLE
CREATE TABLE public.subjects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#4361EE',
  question_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects are viewable by everyone" ON public.subjects
  FOR SELECT USING (true);

-- 2. QUESTIONS TABLE
CREATE TABLE public.questions (
  id BIGSERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')) NOT NULL,
  explanation TEXT,
  points_value INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by everyone" ON public.questions
  FOR SELECT USING (true);

-- 3. LEADERBOARD_ENTRIES TABLE
CREATE TABLE public.leaderboard_entries (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')) NOT NULL,
  subject TEXT,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, period, subject)
);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is viewable by everyone" ON public.leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "System can insert leaderboard entries" ON public.leaderboard_entries
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "System can update leaderboard entries" ON public.leaderboard_entries
  FOR UPDATE USING (auth.uid() = profile_id);

-- 4. QUIZ_SESSIONS TABLE
CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id INTEGER REFERENCES public.subjects(id),
  subject_name TEXT,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy DECIMAL DEFAULT 0,
  time_taken INTEGER, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. USER_ANSWERS TABLE
CREATE TABLE public.user_answers (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id BIGINT REFERENCES public.questions(id),
  selected_answer CHAR(1),
  is_correct BOOLEAN DEFAULT false,
  time_spent INTEGER, -- milliseconds
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers" ON public.user_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions 
      WHERE quiz_sessions.id = user_answers.session_id 
      AND quiz_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers" ON public.user_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions 
      WHERE quiz_sessions.id = user_answers.session_id 
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- 6. BATTLES TABLE (PvP)
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id INTEGER REFERENCES public.subjects(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
  winner_id UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battles are viewable by everyone" ON public.battles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create battles" ON public.battles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update battles" ON public.battles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 7. BATTLE_PARTICIPANTS TABLE
CREATE TABLE public.battle_participants (
  battle_id UUID REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  answers_correct INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (battle_id, user_id)
);

ALTER TABLE public.battle_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battle participants viewable by everyone" ON public.battle_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join battles" ON public.battle_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own battle score" ON public.battle_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. BADGES TABLE
CREATE TABLE public.badges (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT CHECK (requirement_type IN ('points', 'streak', 'accuracy', 'quizzes', 'battles', 'custom')),
  requirement_value INTEGER,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

-- 9. USER_BADGES TABLE
CREATE TABLE public.user_badges (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. SUBSCRIPTIONS TABLE (Premium)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')) DEFAULT 'active',
  plan TEXT DEFAULT 'premium',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 11. AI_SUMMARY_JOBS TABLE
CREATE TABLE public.ai_summary_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  summary_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ai_summary_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI jobs" ON public.ai_summary_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI jobs" ON public.ai_summary_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI jobs" ON public.ai_summary_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Add weekly_points column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accuracy DECIMAL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_participants;

-- Function to update user stats after quiz completion
CREATE OR REPLACE FUNCTION public.update_user_stats_after_quiz()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile stats
  UPDATE public.profiles
  SET 
    total_points = COALESCE(total_points, 0) + NEW.score,
    total_quizzes_completed = COALESCE(total_quizzes_completed, 0) + 1,
    total_correct_answers = COALESCE(total_correct_answers, 0) + NEW.correct_answers,
    total_questions_answered = COALESCE(total_questions_answered, 0) + NEW.total_questions,
    accuracy = CASE 
      WHEN COALESCE(total_questions_answered, 0) + NEW.total_questions > 0 
      THEN ((COALESCE(total_correct_answers, 0) + NEW.correct_answers)::DECIMAL / 
            (COALESCE(total_questions_answered, 0) + NEW.total_questions)) * 100
      ELSE 0 
    END,
    last_active_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update stats when quiz session is completed
CREATE TRIGGER on_quiz_session_completed
  AFTER INSERT ON public.quiz_sessions
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION public.update_user_stats_after_quiz();

-- Function to update leaderboard entries
CREATE OR REPLACE FUNCTION public.update_leaderboard_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert all_time leaderboard entry
  INSERT INTO public.leaderboard_entries (profile_id, period, points, updated_at)
  VALUES (NEW.id, 'all_time', NEW.total_points, NOW())
  ON CONFLICT (profile_id, period, subject) 
  DO UPDATE SET points = NEW.total_points, updated_at = NOW();
  
  -- Upsert weekly leaderboard entry
  INSERT INTO public.leaderboard_entries (profile_id, period, points, updated_at)
  VALUES (NEW.id, 'weekly', NEW.weekly_points, NOW())
  ON CONFLICT (profile_id, period, subject) 
  DO UPDATE SET points = NEW.weekly_points, updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger to update leaderboard when profile points change
CREATE TRIGGER on_profile_points_updated
  AFTER UPDATE OF total_points, weekly_points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leaderboard_entries();

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_points INTEGER;
  user_streak INTEGER;
  user_accuracy DECIMAL;
  user_quizzes INTEGER;
  badge_record RECORD;
BEGIN
  -- Get user stats
  SELECT total_points, current_streak, accuracy, total_quizzes_completed 
  INTO user_points, user_streak, user_accuracy, user_quizzes
  FROM public.profiles WHERE id = user_uuid;
  
  -- Check each badge requirement
  FOR badge_record IN 
    SELECT * FROM public.badges WHERE id NOT IN (
      SELECT badge_id FROM public.user_badges WHERE user_id = user_uuid
    )
  LOOP
    CASE badge_record.requirement_type
      WHEN 'points' THEN
        IF user_points >= badge_record.requirement_value THEN
          INSERT INTO public.user_badges (user_id, badge_id) 
          VALUES (user_uuid, badge_record.id)
          ON CONFLICT DO NOTHING;
        END IF;
      WHEN 'streak' THEN
        IF user_streak >= badge_record.requirement_value THEN
          INSERT INTO public.user_badges (user_id, badge_id) 
          VALUES (user_uuid, badge_record.id)
          ON CONFLICT DO NOTHING;
        END IF;
      WHEN 'accuracy' THEN
        IF user_accuracy >= badge_record.requirement_value THEN
          INSERT INTO public.user_badges (user_id, badge_id) 
          VALUES (user_uuid, badge_record.id)
          ON CONFLICT DO NOTHING;
        END IF;
      WHEN 'quizzes' THEN
        IF user_quizzes >= badge_record.requirement_value THEN
          INSERT INTO public.user_badges (user_id, badge_id) 
          VALUES (user_uuid, badge_record.id)
          ON CONFLICT DO NOTHING;
        END IF;
      ELSE
        -- Custom badges handled elsewhere
        NULL;
    END CASE;
  END LOOP;
END;
$$;

-- Function to get user's global rank
CREATE OR REPLACE FUNCTION public.get_user_rank(user_uuid UUID)
RETURNS TABLE(rank BIGINT, total_points INTEGER, percentile DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      p.id,
      p.total_points as points,
      ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as user_rank,
      COUNT(*) OVER () as total_users
    FROM public.profiles p
    WHERE p.total_points > 0
  )
  SELECT 
    r.user_rank as rank,
    r.points as total_points,
    ROUND(((r.total_users - r.user_rank + 1)::DECIMAL / r.total_users) * 100, 1) as percentile
  FROM ranked r
  WHERE r.id = user_uuid;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  current_streak_val INTEGER;
BEGIN
  SELECT last_active_date, current_streak INTO last_date, current_streak_val
  FROM public.profiles WHERE id = user_uuid;
  
  IF last_date IS NULL OR last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    UPDATE public.profiles 
    SET current_streak = 1, last_active_date = CURRENT_DATE, updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continuing streak
    UPDATE public.profiles 
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_active_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF last_date = CURRENT_DATE THEN
    -- Already active today, no change
    NULL;
  END IF;
  
  -- Record daily streak
  INSERT INTO public.daily_streaks (user_id, streak_date, points_earned)
  VALUES (user_uuid, CURRENT_DATE, 0)
  ON CONFLICT DO NOTHING;
END;
$$;