-- Add explicit match type for PvP battles
ALTER TABLE public.battles
ADD COLUMN IF NOT EXISTS match_type text NOT NULL DEFAULT 'casual';

CREATE INDEX IF NOT EXISTS idx_battles_match_type_status_completed
ON public.battles (match_type, status, completed_at DESC);

-- Add dedicated ranked PvP points
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rank_points integer NOT NULL DEFAULT 1000;

-- Store per-battle ranked point deltas for UI + auditability
CREATE TABLE IF NOT EXISTS public.battle_rank_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  delta integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT 'ranked_result',
  repeat_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (battle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_rank_changes_user_created
ON public.battle_rank_changes (user_id, created_at DESC);

ALTER TABLE public.battle_rank_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own battle rank changes" ON public.battle_rank_changes;
CREATE POLICY "Users can view own battle rank changes"
ON public.battle_rank_changes
FOR SELECT
USING (auth.uid() = user_id);

-- Ranked result processor with anti-farming dampening
CREATE OR REPLACE FUNCTION public.apply_ranked_result_on_battle_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_ids uuid[];
  winner_id uuid;
  loser_id uuid;
  winner_points integer;
  loser_points integer;
  recent_repeat integer;
  anti_farm_factor numeric;
  expected_winner numeric;
  rank_delta integer;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.match_type, 'casual') <> 'ranked' THEN
    RETURN NEW;
  END IF;

  winner_id := NEW.winner_id;
  IF winner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(bp.user_id ORDER BY bp.user_id)
  INTO participant_ids
  FROM public.battle_participants bp
  WHERE bp.battle_id = NEW.id;

  IF participant_ids IS NULL OR array_length(participant_ids, 1) < 2 THEN
    RETURN NEW;
  END IF;

  IF participant_ids[1] = winner_id THEN
    loser_id := participant_ids[2];
  ELSE
    loser_id := participant_ids[1];
  END IF;

  IF loser_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(rank_points, 1000)
  INTO winner_points
  FROM public.profiles
  WHERE id = winner_id
  FOR UPDATE;

  SELECT COALESCE(rank_points, 1000)
  INTO loser_points
  FROM public.profiles
  WHERE id = loser_id
  FOR UPDATE;

  IF winner_points IS NULL OR loser_points IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(DISTINCT b.id)
  INTO recent_repeat
  FROM public.battles b
  JOIN public.battle_participants p1 ON p1.battle_id = b.id
  JOIN public.battle_participants p2 ON p2.battle_id = b.id AND p2.user_id <> p1.user_id
  WHERE b.id <> NEW.id
    AND b.status = 'completed'
    AND COALESCE(b.match_type, 'casual') = 'ranked'
    AND b.completed_at >= now() - interval '2 hours'
    AND LEAST(p1.user_id, p2.user_id) = LEAST(winner_id, loser_id)
    AND GREATEST(p1.user_id, p2.user_id) = GREATEST(winner_id, loser_id);

  anti_farm_factor := CASE
    WHEN recent_repeat >= 4 THEN 0
    WHEN recent_repeat = 3 THEN 0.15
    WHEN recent_repeat = 2 THEN 0.30
    WHEN recent_repeat = 1 THEN 0.60
    ELSE 1
  END;

  IF anti_farm_factor = 0 THEN
    rank_delta := 0;
  ELSE
    expected_winner := 1 / (1 + power(10, ((loser_points - winner_points)::numeric / 400)));
    rank_delta := GREATEST(4, ROUND(24 * anti_farm_factor * (1 - expected_winner))::integer);
  END IF;

  UPDATE public.profiles
  SET rank_points = GREATEST(0, COALESCE(rank_points, 1000) + rank_delta),
      updated_at = now()
  WHERE id = winner_id;

  UPDATE public.profiles
  SET rank_points = GREATEST(0, COALESCE(rank_points, 1000) - rank_delta),
      updated_at = now()
  WHERE id = loser_id;

  INSERT INTO public.battle_rank_changes (battle_id, user_id, opponent_id, delta, reason, repeat_count)
  VALUES
    (NEW.id, winner_id, loser_id, rank_delta, 'ranked_result', recent_repeat),
    (NEW.id, loser_id, winner_id, -rank_delta, 'ranked_result', recent_repeat)
  ON CONFLICT (battle_id, user_id) DO NOTHING;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES
    (
      winner_id,
      'system',
      'Rank Updated',
      CASE WHEN rank_delta > 0
        THEN 'Ranked duel won! +' || rank_delta || ' rank points.'
        ELSE 'Ranked duel processed. No rank points awarded (anti-farm).'
      END,
      jsonb_build_object('battle_id', NEW.id, 'delta', rank_delta, 'repeat_count', recent_repeat)
    ),
    (
      loser_id,
      'system',
      'Rank Updated',
      CASE WHEN rank_delta > 0
        THEN 'Ranked duel lost. -' || rank_delta || ' rank points.'
        ELSE 'Ranked duel processed. No rank points deducted (anti-farm).'
      END,
      jsonb_build_object('battle_id', NEW.id, 'delta', -rank_delta, 'repeat_count', recent_repeat)
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_ranked_result_on_battle_complete ON public.battles;
CREATE TRIGGER trg_apply_ranked_result_on_battle_complete
AFTER UPDATE OF status ON public.battles
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
EXECUTE FUNCTION public.apply_ranked_result_on_battle_complete();

-- Server-side notification generation for social events
CREATE OR REPLACE FUNCTION public.create_friend_request_notification_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.to_user_id,
    'friend_request',
    'New Friend Request',
    'You have a new friend request!',
    jsonb_build_object('request_id', NEW.id, 'from_user_id', NEW.from_user_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friend_request_notification ON public.friend_requests;
CREATE TRIGGER trg_friend_request_notification
AFTER INSERT ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_friend_request_notification_trigger();

CREATE OR REPLACE FUNCTION public.create_direct_message_notification_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM NEW.receiver_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.receiver_id,
      'chat',
      'New Message',
      CASE
        WHEN NEW.message_type = 'text' THEN LEFT(COALESCE(NEW.message, 'New message'), 100)
        ELSE 'Sent you a media message'
      END,
      jsonb_build_object('sender_id', NEW.sender_id, 'chatId', NEW.sender_id, 'message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_direct_message_notification ON public.direct_messages;
CREATE TRIGGER trg_direct_message_notification
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.create_direct_message_notification_trigger();

-- Realtime subscriptions support for notifications + friend requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'friend_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
  END IF;
END;
$$;