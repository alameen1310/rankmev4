-- Daily Challenges Table
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  question_ids INTEGER[] NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 10,
  time_limit_seconds INTEGER NOT NULL DEFAULT 600, -- 10 minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily Challenge Attempts Table
CREATE TABLE public.daily_challenge_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Daily Leaderboard Table (cached for performance)
CREATE TABLE public.daily_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_challenges (everyone can read today's challenge)
CREATE POLICY "Anyone can view daily challenges"
ON public.daily_challenges
FOR SELECT
USING (true);

-- RLS Policies for daily_challenge_attempts
CREATE POLICY "Users can view all attempts for leaderboard"
ON public.daily_challenge_attempts
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own attempts"
ON public.daily_challenge_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
ON public.daily_challenge_attempts
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for daily_leaderboards
CREATE POLICY "Anyone can view leaderboards"
ON public.daily_leaderboards
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage leaderboards"
ON public.daily_leaderboards
FOR ALL
USING (true);

-- Function to get or create today's challenge
CREATE OR REPLACE FUNCTION public.get_or_create_daily_challenge()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  challenge_id UUID;
  today_date DATE := CURRENT_DATE;
  question_array INTEGER[];
BEGIN
  -- Check if today's challenge exists
  SELECT id INTO challenge_id
  FROM public.daily_challenges
  WHERE challenge_date = today_date;
  
  IF challenge_id IS NULL THEN
    -- Get 10 random questions from the questions table
    SELECT ARRAY(
      SELECT id FROM public.questions
      ORDER BY RANDOM()
      LIMIT 10
    ) INTO question_array;
    
    -- Create new challenge
    INSERT INTO public.daily_challenges (challenge_date, question_ids, total_questions)
    VALUES (today_date, question_array, 10)
    RETURNING id INTO challenge_id;
  END IF;
  
  RETURN challenge_id;
END;
$$;

-- Function to update daily leaderboard ranks
CREATE OR REPLACE FUNCTION public.update_daily_leaderboard_ranks(p_challenge_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete existing leaderboard entries for this challenge
  DELETE FROM public.daily_leaderboards WHERE challenge_id = p_challenge_id;
  
  -- Insert new ranked entries
  INSERT INTO public.daily_leaderboards (challenge_id, user_id, rank, score, accuracy, time_taken_seconds)
  SELECT 
    p_challenge_id,
    user_id,
    ROW_NUMBER() OVER (ORDER BY score DESC, time_taken_seconds ASC) as rank,
    score,
    accuracy,
    time_taken_seconds
  FROM public.daily_challenge_attempts
  WHERE challenge_id = p_challenge_id;
END;
$$;

-- Trigger to update leaderboard when an attempt is inserted
CREATE OR REPLACE FUNCTION public.trigger_update_daily_leaderboard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.update_daily_leaderboard_ranks(NEW.challenge_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_daily_attempt_insert
AFTER INSERT ON public.daily_challenge_attempts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_daily_leaderboard();

-- Index for faster queries
CREATE INDEX idx_daily_challenges_date ON public.daily_challenges(challenge_date DESC);
CREATE INDEX idx_daily_attempts_challenge ON public.daily_challenge_attempts(challenge_id);
CREATE INDEX idx_daily_attempts_user ON public.daily_challenge_attempts(user_id);
CREATE INDEX idx_daily_leaderboards_challenge ON public.daily_leaderboards(challenge_id, rank);

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_leaderboards;