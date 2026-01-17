-- Update sync_leaderboard_on_points_change to use correct tier thresholds
CREATE OR REPLACE FUNCTION public.sync_leaderboard_on_points_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calculated_tier TEXT;
BEGIN
  -- Calculate tier based on new points - ALIGNED WITH UI thresholds
  calculated_tier := CASE
    WHEN COALESCE(NEW.total_points, 0) >= 50000 THEN 'champion'
    WHEN COALESCE(NEW.total_points, 0) >= 30000 THEN 'diamond'
    WHEN COALESCE(NEW.total_points, 0) >= 15000 THEN 'platinum'
    WHEN COALESCE(NEW.total_points, 0) >= 7500 THEN 'gold'
    WHEN COALESCE(NEW.total_points, 0) >= 3000 THEN 'silver'
    ELSE 'bronze'
  END;

  -- Update tier if it changed
  IF NEW.tier IS DISTINCT FROM calculated_tier THEN
    NEW.tier := calculated_tier;
  END IF;

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
$function$;

-- Update update_user_stats_after_quiz to use correct tier thresholds
CREATE OR REPLACE FUNCTION public.update_user_stats_after_quiz()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_total_points INTEGER;
  new_tier TEXT;
BEGIN
  -- Calculate new total points
  new_total_points := COALESCE((SELECT total_points FROM public.profiles WHERE id = NEW.user_id), 0) + COALESCE(NEW.score, 0);
  
  -- Calculate tier based on new points - ALIGNED WITH UI thresholds
  new_tier := CASE
    WHEN new_total_points >= 50000 THEN 'champion'
    WHEN new_total_points >= 30000 THEN 'diamond'
    WHEN new_total_points >= 15000 THEN 'platinum'
    WHEN new_total_points >= 7500 THEN 'gold'
    WHEN new_total_points >= 3000 THEN 'silver'
    ELSE 'bronze'
  END;
  
  -- Update profile stats including tier
  UPDATE public.profiles
  SET 
    total_points = new_total_points,
    tier = new_tier,
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
$function$;

-- Add chat_streak and last_chat_date to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS chat_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_chat_date DATE;

-- Create function to update chat streak when user sends a message
CREATE OR REPLACE FUNCTION public.update_chat_streak(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_date DATE;
  current_chat_streak INTEGER;
BEGIN
  SELECT last_chat_date, chat_streak INTO last_date, current_chat_streak
  FROM public.profiles WHERE id = user_uuid;
  
  IF last_date IS NULL OR last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken or first message ever
    UPDATE public.profiles 
    SET chat_streak = 1, last_chat_date = CURRENT_DATE, updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    UPDATE public.profiles 
    SET 
      chat_streak = COALESCE(chat_streak, 0) + 1,
      last_chat_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF last_date = CURRENT_DATE THEN
    -- Already chatted today, no change
    NULL;
  END IF;
END;
$function$;

-- Recalculate all tiers to match new thresholds
UPDATE public.profiles
SET tier = CASE
    WHEN COALESCE(total_points, 0) >= 50000 THEN 'champion'
    WHEN COALESCE(total_points, 0) >= 30000 THEN 'diamond'
    WHEN COALESCE(total_points, 0) >= 15000 THEN 'platinum'
    WHEN COALESCE(total_points, 0) >= 7500 THEN 'gold'
    WHEN COALESCE(total_points, 0) >= 3000 THEN 'silver'
    ELSE 'bronze'
  END,
  updated_at = NOW();