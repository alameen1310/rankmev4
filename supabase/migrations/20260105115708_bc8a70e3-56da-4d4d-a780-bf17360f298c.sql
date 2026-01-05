-- Add comprehensive media support to direct_messages
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Update message_type to support all media types
-- First drop the constraint if it exists, then add new one
ALTER TABLE direct_messages 
DROP CONSTRAINT IF EXISTS direct_messages_message_type_check;

-- Create a chat_media_uploads storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media', 
  'chat-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg'];

-- Storage policies for chat media
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);