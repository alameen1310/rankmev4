
-- Matchmaking queue table
CREATE TABLE public.matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type text NOT NULL DEFAULT 'casual' CHECK (match_type IN ('casual', 'ranked')),
  subject_id integer REFERENCES public.subjects(id),
  tier text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled', 'expired')),
  matched_with uuid REFERENCES public.profiles(id),
  battle_id uuid REFERENCES public.battles(id),
  UNIQUE(user_id, status)
);

-- Drop the unique constraint (can't have unique on user_id+status since they can have multiple cancelled entries)
ALTER TABLE public.matchmaking_queue DROP CONSTRAINT matchmaking_queue_user_id_status_key;

-- Create a partial unique index: only one 'searching' entry per user
CREATE UNIQUE INDEX idx_one_searching_per_user ON public.matchmaking_queue (user_id) WHERE status = 'searching';

-- Index for fast matching queries
CREATE INDEX idx_matchmaking_queue_searching ON public.matchmaking_queue (status, match_type, subject_id, tier, created_at) WHERE status = 'searching';

-- Enable RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own queue entries"
  ON public.matchmaking_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert themselves into queue"
  ON public.matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries"
  ON public.matchmaking_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entries"
  ON public.matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for matchmaking
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
