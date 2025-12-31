import { supabase } from '@/integrations/supabase/client';

export interface FriendProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  tier: string | null;
  total_points: number | null;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at: string | null;
  from_user?: FriendProfile;
  to_user?: FriendProfile;
}

export async function searchUsers(query: string, currentUserId: string): Promise<FriendProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, country, tier, total_points')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', currentUserId)
    .limit(10);
  
  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }
  
  return (data || []) as FriendProfile[];
}

export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
  
  // Create notification for the recipient
  await supabase
    .from('notifications')
    .insert({
      user_id: toUserId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: 'You have a new friend request!',
      data: { request_id: data.id, from_user_id: fromUserId },
    });
  
  return data as FriendRequest;
}

export async function getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching friend requests:', error);
    throw error;
  }
  
  // Fetch from_user profiles for each request
  const requests = data || [];
  const fromUserIds = requests.map(r => r.from_user_id);
  
  if (fromUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, country, tier, total_points')
      .in('id', fromUserIds);
    
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    return requests.map(r => ({
      ...r,
      from_user: profileMap.get(r.from_user_id) as FriendProfile | undefined,
    })) as FriendRequest[];
  }
  
  return requests as FriendRequest[];
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  // Get the request details first
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('from_user_id, to_user_id')
    .eq('id', requestId)
    .single();
  
  if (fetchError || !request) {
    console.error('Error fetching friend request:', fetchError);
    throw fetchError;
  }
  
  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ 
      status: 'accepted', 
      responded_at: new Date().toISOString() 
    })
    .eq('id', requestId);
  
  if (updateError) {
    console.error('Error accepting friend request:', updateError);
    throw updateError;
  }
  
  // Create bidirectional friendship records
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert([
      { user_id: request.from_user_id, friend_id: request.to_user_id },
      { user_id: request.to_user_id, friend_id: request.from_user_id },
    ]);
  
  if (friendshipError) {
    console.error('Error creating friendship:', friendshipError);
    // Don't throw - the request was accepted, friendship creation is secondary
  }
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({ 
      status: 'rejected', 
      responded_at: new Date().toISOString() 
    })
    .eq('id', requestId);
  
  if (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
}

export async function getFriends(userId: string): Promise<FriendProfile[]> {
  // Get friend IDs
  const { data: friendships, error: friendshipError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId);
  
  if (friendshipError) {
    console.error('Error fetching friendships:', friendshipError);
    throw friendshipError;
  }
  
  const friendIds = (friendships || []).map(f => f.friend_id);
  
  if (friendIds.length === 0) {
    return [];
  }
  
  // Get friend profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, country, tier, total_points')
    .in('id', friendIds)
    .order('total_points', { ascending: false });
  
  if (profileError) {
    console.error('Error fetching friend profiles:', profileError);
    throw profileError;
  }
  
  return (profiles || []) as FriendProfile[];
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  // Remove both directions of the friendship
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
  
  if (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
}

export async function getNotifications(userId: string, unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (unreadOnly) {
    query = query.eq('read', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
  
  return data || [];
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}
