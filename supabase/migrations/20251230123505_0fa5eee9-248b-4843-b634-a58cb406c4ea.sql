-- Fix search_path for check_and_award_badges function (already has it, but re-apply to ensure)
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
  SELECT total_points, current_streak, accuracy, total_quizzes_completed 
  INTO user_points, user_streak, user_accuracy, user_quizzes
  FROM public.profiles WHERE id = user_uuid;
  
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
        NULL;
    END CASE;
  END LOOP;
END;
$$;

-- Fix search_path for get_user_rank function
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

-- Fix search_path for update_user_streak function
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
    UPDATE public.profiles 
    SET current_streak = 1, last_active_date = CURRENT_DATE, updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles 
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_active_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF last_date = CURRENT_DATE THEN
    NULL;
  END IF;
  
  INSERT INTO public.daily_streaks (user_id, streak_date, points_earned)
  VALUES (user_uuid, CURRENT_DATE, 0)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Fix search_path for update_user_stats_after_quiz function
CREATE OR REPLACE FUNCTION public.update_user_stats_after_quiz()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- Fix search_path for update_leaderboard_entries function
CREATE OR REPLACE FUNCTION public.update_leaderboard_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_entries (profile_id, period, points, updated_at)
  VALUES (NEW.id, 'all_time', NEW.total_points, NOW())
  ON CONFLICT (profile_id, period, subject) 
  DO UPDATE SET points = NEW.total_points, updated_at = NOW();
  
  INSERT INTO public.leaderboard_entries (profile_id, period, points, updated_at)
  VALUES (NEW.id, 'weekly', NEW.weekly_points, NOW())
  ON CONFLICT (profile_id, period, subject) 
  DO UPDATE SET points = NEW.weekly_points, updated_at = NOW();
  
  RETURN NEW;
END;
$$;