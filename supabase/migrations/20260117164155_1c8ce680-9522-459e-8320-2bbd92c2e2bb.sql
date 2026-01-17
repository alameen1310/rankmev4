-- Update the function to also calculate tier when points change
CREATE OR REPLACE FUNCTION public.update_user_stats_after_quiz()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total_points INTEGER;
  new_tier TEXT;
BEGIN
  -- Calculate new total points
  new_total_points := COALESCE((SELECT total_points FROM public.profiles WHERE id = NEW.user_id), 0) + COALESCE(NEW.score, 0);
  
  -- Calculate tier based on new points
  new_tier := CASE
    WHEN new_total_points >= 50000 THEN 'diamond'
    WHEN new_total_points >= 25000 THEN 'platinum'
    WHEN new_total_points >= 10000 THEN 'gold'
    WHEN new_total_points >= 5000 THEN 'silver'
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
$$;

-- Also update the sync_leaderboard function to include tier updates
CREATE OR REPLACE FUNCTION public.sync_leaderboard_on_points_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_tier TEXT;
BEGIN
  -- Calculate tier based on new points
  calculated_tier := CASE
    WHEN COALESCE(NEW.total_points, 0) >= 50000 THEN 'diamond'
    WHEN COALESCE(NEW.total_points, 0) >= 25000 THEN 'platinum'
    WHEN COALESCE(NEW.total_points, 0) >= 10000 THEN 'gold'
    WHEN COALESCE(NEW.total_points, 0) >= 5000 THEN 'silver'
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
$$;