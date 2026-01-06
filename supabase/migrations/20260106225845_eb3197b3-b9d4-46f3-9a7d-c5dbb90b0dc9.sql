-- Add reply_to_id column for message replies
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_direct_messages_reply_to ON public.direct_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Create index for faster status updates
CREATE INDEX IF NOT EXISTS idx_direct_messages_status ON public.direct_messages(status) WHERE status != 'read';