import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type MessageType = 'text' | 'gif' | 'image' | 'video' | 'audio';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: MessageType;
  gif_url?: string;
  media_url?: string;
  thumbnail_url?: string;
  file_size?: number;
  file_name?: string;
  duration?: number;
  width?: number;
  height?: number;
  is_read: boolean;
  status: MessageStatus;
  created_at: string;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    message: string;
    message_type: MessageType;
    sender_id: string;
    sender?: { username: string | null };
  };
  sender?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    username: string | null;
  };
}

// Send a direct message
export async function sendMessage(
  senderId: string,
  receiverId: string,
  messageText: string,
  messageType: MessageType = 'text',
  options?: {
    gifUrl?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    fileSize?: number;
    fileName?: string;
    duration?: number;
    width?: number;
    height?: number;
    replyToId?: string;
  }
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    console.log('[chat] Sending message:', { senderId, receiverId, messageType });
    
    if (messageType === 'text' && !messageText.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }
    
    if (!senderId || !receiverId) {
      return { success: false, error: 'Missing sender or receiver ID' };
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: messageText.trim() || getDefaultMessageText(messageType),
        message_type: messageType,
        gif_url: options?.gifUrl,
        media_url: options?.mediaUrl,
        thumbnail_url: options?.thumbnailUrl,
        file_size: options?.fileSize,
        file_name: options?.fileName,
        duration: options?.duration,
        width: options?.width,
        height: options?.height,
        reply_to_id: options?.replyToId,
        is_read: false,
        status: 'sent',
      })
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('[chat] Error sending message:', error);
      return { success: false, error: error.message };
    }

    console.log('[chat] Message sent successfully:', data.id);
    return { 
      success: true, 
      message: mapRowToMessage(data)
    };
  } catch (error: unknown) {
    console.error('[chat] Unexpected error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function getDefaultMessageText(type: MessageType): string {
  switch (type) {
    case 'gif': return 'GIF';
    case 'image': return '📷 Photo';
    case 'video': return '🎬 Video';
    case 'audio': return '🎤 Voice message';
    default: return '';
  }
}

function mapRowToMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    message: row.message,
    message_type: (row.message_type || 'text') as MessageType,
    gif_url: row.gif_url ?? undefined,
    media_url: row.media_url ?? undefined,
    thumbnail_url: row.thumbnail_url ?? undefined,
    file_size: row.file_size ?? undefined,
    file_name: row.file_name ?? undefined,
    duration: row.duration ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    is_read: row.is_read ?? false,
    status: (row.status || 'sent') as MessageStatus,
    created_at: row.created_at ?? new Date().toISOString(),
    reply_to_id: row.reply_to_id ?? undefined,
    reply_to: row.reply_to ?? undefined,
    sender: row.sender as ChatMessage['sender'],
    reactions: row.reactions || [],
  };
}

// Get messages between two users
export async function getMessages(
  userId: string,
  friendId: string,
  limit = 50
): Promise<ChatMessage[]> {
  try {
    console.log('[chat] Getting messages between:', userId, friendId);

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[chat] Error fetching messages:', error);
      return [];
    }

    const messageIds = (data || []).map(m => m.id);
    
    // Fetch reactions for all messages
    let reactions: MessageReaction[] = [];
    if (messageIds.length > 0) {
      const { data: reactionsData } = await supabase
        .from('message_reactions')
        .select(`
          *,
          user:profiles!message_reactions_user_id_fkey (
            username
          )
        `)
        .in('message_id', messageIds);
      reactions = (reactionsData || []) as MessageReaction[];
    }

    console.log('[chat] Found', data?.length || 0, 'messages');
    return (data || []).map(msg => ({
      ...mapRowToMessage(msg),
      reactions: reactions.filter(r => r.message_id === msg.id),
    }));
  } catch (error) {
    console.error('[chat] Failed to get messages:', error);
    return [];
  }
}

// Mark messages as read and update status
export async function markMessagesAsRead(
  userId: string,
  friendId: string
): Promise<void> {
  try {
    await supabase
      .from('direct_messages')
      .update({ is_read: true, status: 'read' })
      .eq('receiver_id', userId)
      .eq('sender_id', friendId)
      .eq('is_read', false);
  } catch (error) {
    console.error('[chat] Failed to mark messages as read:', error);
  }
}

// Get unread message count
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('[chat] Failed to get unread count:', error);
    return 0;
  }
}

// Add reaction to a message
export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji,
      });

    if (error) {
      // If it's a unique constraint violation, the reaction already exists
      if (error.code === '23505') {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[chat] Failed to add reaction:', error);
    return { success: false, error: 'Failed to add reaction' };
  }
}

// Remove reaction from a message
export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[chat] Failed to remove reaction:', error);
    return { success: false, error: 'Failed to remove reaction' };
  }
}

// Subscribe to new messages in a conversation
export function subscribeToMessages(
  userId: string,
  friendId: string,
  onNewMessage: (message: ChatMessage) => void
): RealtimeChannel {
  console.log('[chat] Subscribing to messages:', userId, '↔', friendId);

  const channel = supabase.channel(`dm:${userId}:${friendId}`);

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
    },
    async (payload) => {
      const newMsg = payload.new as { 
        id: string; 
        sender_id: string; 
        receiver_id: string; 
        message: string; 
        message_type?: string;
        gif_url?: string;
        is_read: boolean; 
        status?: string;
        created_at: string; 
      };
      
      // Only process messages in this conversation
      const isInConversation = 
        (newMsg.sender_id === userId && newMsg.receiver_id === friendId) ||
        (newMsg.sender_id === friendId && newMsg.receiver_id === userId);
      
      if (!isInConversation) return;

      console.log('[chat] New message via realtime:', newMsg.id);

      // Get sender profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', newMsg.sender_id)
        .single();

      onNewMessage({
        ...mapRowToMessage(newMsg),
        sender: profile || { id: newMsg.sender_id, username: null, avatar_url: null },
        reactions: [],
      });

      // Auto-mark as read if it's for current user and update to delivered
      if (newMsg.receiver_id === userId) {
        await markMessagesAsRead(userId, friendId);
      } else if (newMsg.sender_id === userId) {
        // Update status to delivered when sent by current user
        await supabase
          .from('direct_messages')
          .update({ status: 'delivered' })
          .eq('id', newMsg.id);
      }
    }
  ).subscribe((status) => {
    console.log('[chat] Subscription status:', status);
  });

  return channel;
}

// Subscribe to reactions changes
export function subscribeToReactions(
  messageIds: string[],
  onReactionChange: (reaction: MessageReaction, type: 'INSERT' | 'DELETE') => void
): RealtimeChannel {
  const channel = supabase.channel('reactions-changes');

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'message_reactions',
    },
    async (payload) => {
      if (payload.eventType === 'INSERT') {
        const newReaction = payload.new as MessageReaction;
        if (messageIds.includes(newReaction.message_id)) {
          // Get username
          const { data: user } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newReaction.user_id)
            .single();
          
          onReactionChange({ ...newReaction, user }, 'INSERT');
        }
      } else if (payload.eventType === 'DELETE') {
        const oldReaction = payload.old as MessageReaction;
        onReactionChange(oldReaction, 'DELETE');
      }
    }
  ).subscribe();

  return channel;
}
