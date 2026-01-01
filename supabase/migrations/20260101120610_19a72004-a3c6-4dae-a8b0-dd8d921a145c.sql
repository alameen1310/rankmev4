-- Add missing columns to battles table
ALTER TABLE battles ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT '1v1' CHECK (mode IN ('1v1', 'tournament'));
ALTER TABLE battles ADD COLUMN IF NOT EXISTS room_code TEXT UNIQUE;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS time_per_question INTEGER DEFAULT 20;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 10;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to battle_participants
ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'joined' CHECK (status IN ('invited', 'joined', 'ready', 'disconnected', 'finished'));
ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0;
ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS total_time INTEGER DEFAULT 0;
ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE battle_participants ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;

-- Create battle_answers table
CREATE TABLE IF NOT EXISTS battle_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN DEFAULT false,
  time_spent INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(battle_id, user_id, question_id)
);

-- Create battle_live_state table
CREATE TABLE IF NOT EXISTS battle_live_state (
  battle_id UUID PRIMARY KEY REFERENCES battles(id) ON DELETE CASCADE,
  current_question INTEGER DEFAULT 1,
  question_start_time TIMESTAMP WITH TIME ZONE,
  status_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_room_participants table
CREATE TABLE IF NOT EXISTS chat_room_participants (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'battle_invite', 'system')),
  data JSONB DEFAULT '{}'::jsonb,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE battle_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_live_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for battle_answers
CREATE POLICY "Battle answers viewable by participants" ON battle_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM battle_participants bp WHERE bp.battle_id = battle_answers.battle_id AND bp.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own battle answers" ON battle_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for battle_live_state
CREATE POLICY "Battle live state viewable by participants" ON battle_live_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM battle_participants bp WHERE bp.battle_id = battle_live_state.battle_id AND bp.user_id = auth.uid())
  );

CREATE POLICY "Battle live state updatable by participants" ON battle_live_state
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM battle_participants bp WHERE bp.battle_id = battle_live_state.battle_id AND bp.user_id = auth.uid())
  );

CREATE POLICY "Battle live state insertable by participants" ON battle_live_state
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM battle_participants bp WHERE bp.battle_id = battle_live_state.battle_id AND bp.user_id = auth.uid())
  );

-- RLS policies for chat_rooms
CREATE POLICY "Chat rooms viewable by participants" ON chat_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_room_participants crp WHERE crp.room_id = id AND crp.user_id = auth.uid())
  );

CREATE POLICY "Users can create chat rooms" ON chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for chat_room_participants
CREATE POLICY "Chat room participants viewable by room members" ON chat_room_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_room_participants crp WHERE crp.room_id = chat_room_participants.room_id AND crp.user_id = auth.uid())
  );

CREATE POLICY "Users can join chat rooms" ON chat_room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON chat_room_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for chat_messages
CREATE POLICY "Chat messages viewable by room members" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_room_participants crp WHERE crp.room_id = chat_messages.room_id AND crp.user_id = auth.uid())
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create function to update battle score
CREATE OR REPLACE FUNCTION update_battle_score(
  battle_id_param UUID,
  user_id_param UUID,
  points_to_add INTEGER,
  correct_to_add INTEGER,
  time_to_add INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE battle_participants
  SET 
    score = COALESCE(score, 0) + points_to_add,
    correct_answers = COALESCE(correct_answers, 0) + correct_to_add,
    total_time = COALESCE(total_time, 0) + time_to_add
  WHERE battle_id = battle_id_param AND user_id = user_id_param;
END;
$$;

-- Create function to get or create direct chat room
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Check if a direct chat room already exists between these users
  SELECT crp1.room_id INTO room_id
  FROM chat_room_participants crp1
  JOIN chat_room_participants crp2 ON crp1.room_id = crp2.room_id
  JOIN chat_rooms cr ON cr.id = crp1.room_id
  WHERE crp1.user_id = user1_id 
    AND crp2.user_id = user2_id 
    AND cr.type = 'direct'
  LIMIT 1;
  
  -- If no room exists, create one
  IF room_id IS NULL THEN
    INSERT INTO chat_rooms (type) VALUES ('direct') RETURNING id INTO room_id;
    INSERT INTO chat_room_participants (room_id, user_id) VALUES (room_id, user1_id), (room_id, user2_id);
  END IF;
  
  RETURN room_id;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_battle_answers_battle ON battle_answers(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_answers_user ON battle_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE battle_live_state;