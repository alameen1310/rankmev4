-- Add status column to direct_messages for sent/delivered/read tracking
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'));

-- Add message_type column for text/gif support
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'gif', 'image'));

-- Add gif_url column for storing GIPHY URLs
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- Enable RLS on reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Users can view reactions on messages they can see" ON message_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM direct_messages dm 
    WHERE dm.id = message_reactions.message_id 
    AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to messages they can see" ON message_reactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM direct_messages dm 
    WHERE dm.id = message_reactions.message_id 
    AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can remove their own reactions" ON message_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;