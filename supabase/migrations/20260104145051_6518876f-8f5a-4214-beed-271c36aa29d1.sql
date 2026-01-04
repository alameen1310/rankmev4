-- STEP 1: Disable RLS to break recursion before dropping
ALTER TABLE IF EXISTS chat_room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop old recursive chat tables
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_room_participants CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- STEP 3: Drop old function
DROP FUNCTION IF EXISTS get_or_create_direct_chat CASCADE;

-- STEP 4: Create simple direct_messages table
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 5: Create indexes
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- STEP 6: Enable RLS with simple, non-recursive policies
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages" ON direct_messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON direct_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read (receiver only)
CREATE POLICY "Users can update received messages" ON direct_messages
FOR UPDATE USING (auth.uid() = receiver_id);

-- STEP 7: Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;