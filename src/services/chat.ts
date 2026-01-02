import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username?: string;
  sender_avatar?: string;
  message_text: string;
  message_type: 'text' | 'image' | 'battle_invite' | 'system';
  data: Record<string, unknown>;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  participants: ChatParticipant[];
  last_message?: ChatMessage;
  unread_count: number;
}

export interface ChatParticipant {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  last_read_at: string;
}

export async function getOrCreateDirectChat(userId1: string, userId2: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_direct_chat', {
    user1_id: userId1,
    user2_id: userId2,
  });
  
  if (error) {
    console.error('Error getting/creating direct chat:', error);
    throw error;
  }
  
  return data;
}

export async function getChatRooms(userId: string): Promise<ChatRoom[]> {
  // Get rooms the user is a participant of
  const { data: participations, error } = await supabase
    .from('chat_room_participants')
    .select('room_id, last_read_at')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching chat room participations:', error);
    throw error;
  }
  
  if (!participations || participations.length === 0) {
    return [];
  }
  
  const roomIds = participations.map(p => p.room_id);
  const lastReadMap = new Map(participations.map(p => [p.room_id, p.last_read_at]));
  
  // Get room details
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('*')
    .in('id', roomIds);
  
  if (!rooms) return [];
  
  // Get participants for each room
  const { data: allParticipants } = await supabase
    .from('chat_room_participants')
    .select('room_id, user_id, joined_at, last_read_at')
    .in('room_id', roomIds);
  
  // Get profiles for all participants
  const participantUserIds = [...new Set((allParticipants || []).map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', participantUserIds);
  
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  
  // Get last message for each room
  const { data: lastMessages } = await supabase
    .from('chat_messages')
    .select('*')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false });
  
  const lastMessageMap = new Map<string, ChatMessage>();
  (lastMessages || []).forEach(msg => {
    if (!lastMessageMap.has(msg.room_id)) {
      lastMessageMap.set(msg.room_id, msg as ChatMessage);
    }
  });
  
  // Build room objects
  return rooms.map(room => ({
    id: room.id,
    type: room.type as 'direct' | 'group',
    name: room.name,
    participants: (allParticipants || [])
      .filter(p => p.room_id === room.id)
      .map(p => ({
        user_id: p.user_id,
        username: profileMap.get(p.user_id)?.username || null,
        display_name: profileMap.get(p.user_id)?.display_name || null,
        avatar_url: profileMap.get(p.user_id)?.avatar_url || null,
        joined_at: p.joined_at,
        last_read_at: p.last_read_at,
      })),
    last_message: lastMessageMap.get(room.id),
    unread_count: (lastMessages || []).filter(
      msg => msg.room_id === room.id && 
      msg.sender_id !== userId &&
      new Date(msg.created_at) > new Date(lastReadMap.get(room.id) || 0)
    ).length,
  }));
}

export async function getChatMessages(
  roomId: string, 
  limit = 50, 
  before?: string
): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (before) {
    query = query.lt('created_at', before);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
  
  // Get sender profiles
  const senderIds = [...new Set((data || []).map(m => m.sender_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', senderIds);
  
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  
  return (data || []).reverse().map(msg => ({
    ...msg,
    sender_username: profileMap.get(msg.sender_id)?.username || 'Unknown',
    sender_avatar: profileMap.get(msg.sender_id)?.avatar_url || undefined,
  })) as ChatMessage[];
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  messageText: string,
  messageType: 'text' | 'image' | 'battle_invite' | 'system' = 'text',
  data: Record<string, unknown> = {}
): Promise<ChatMessage> {
  console.log('[chat] sendMessage()', { roomId, senderId, messageType, messageLength: messageText.length });

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      message_text: messageText,
      message_type: messageType,
      data: data as any,
    });

  if (error) {
    console.error('[chat] Error sending message:', error);
    throw new Error(error.message);
  }

  // We rely on realtime subscription to receive the authoritative inserted row (id/created_at).
  return {
    id: `temp-${Date.now()}`,
    room_id: roomId,
    sender_id: senderId,
    message_text: messageText,
    message_type: messageType,
    data,
    created_at: new Date().toISOString(),
  };
}

export async function markRoomAsRead(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_room_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error marking room as read:', error);
  }
}

export function subscribeToChatRoom(
  roomId: string,
  onNewMessage: (message: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase.channel(`chat:${roomId}`);
  
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        const msg = payload.new as ChatMessage;
        
        // Get sender profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', msg.sender_id)
          .single();
        
        onNewMessage({
          ...msg,
          sender_username: profile?.username || 'Unknown',
          sender_avatar: profile?.avatar_url || undefined,
        });
      }
    )
    .subscribe();
  
  return channel;
}

export async function sendBattleInvite(
  roomId: string,
  senderId: string,
  battleId: string,
  subjectName: string
): Promise<ChatMessage> {
  return sendMessage(
    roomId,
    senderId,
    `🎮 Battle Invitation: ${subjectName}`,
    'battle_invite',
    { battle_id: battleId, subject_name: subjectName }
  );
}
