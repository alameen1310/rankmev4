import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

// Send a direct message
export async function sendMessage(
  senderId: string,
  receiverId: string,
  messageText: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    console.log('[chat] Sending message:', { senderId, receiverId });
    
    if (!messageText.trim()) {
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
        message: messageText.trim(),
        is_read: false,
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
      message: {
        id: data.id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        message: data.message,
        is_read: data.is_read,
        created_at: data.created_at,
        sender: data.sender as ChatMessage['sender'],
      }
    };
  } catch (error: unknown) {
    console.error('[chat] Unexpected error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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

    console.log('[chat] Found', data?.length || 0, 'messages');
    return (data || []).map(msg => ({
      id: msg.id,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      message: msg.message,
      is_read: msg.is_read,
      created_at: msg.created_at,
      sender: msg.sender as ChatMessage['sender'],
    }));
  } catch (error) {
    console.error('[chat] Failed to get messages:', error);
    return [];
  }
}

// Mark messages as read
export async function markMessagesAsRead(
  userId: string,
  friendId: string
): Promise<void> {
  try {
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
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
        is_read: boolean; 
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
        ...newMsg,
        sender: profile || { id: newMsg.sender_id, username: null, avatar_url: null },
      });

      // Auto-mark as read if it's for current user
      if (newMsg.receiver_id === userId) {
        await markMessagesAsRead(userId, friendId);
      }
    }
  ).subscribe((status) => {
    console.log('[chat] Subscription status:', status);
  });

  return channel;
}
