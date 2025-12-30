import { supabase } from '@/integrations/supabase/client';
import type { Tier } from '@/types';

export interface LeaderboardProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  tier: string | null;
  total_points: number | null;
  current_streak: number | null;
  accuracy: number | null;
  total_quizzes_completed: number | null;
}

export interface LeaderboardEntryWithProfile {
  rank: number;
  points: number;
  profile: LeaderboardProfile;
}

export function getTierFromPoints(points: number): Tier {
  if (points >= 50000) return 'champion';
  if (points >= 30000) return 'diamond';
  if (points >= 15000) return 'platinum';
  if (points >= 7500) return 'gold';
  if (points >= 3000) return 'silver';
  return 'bronze';
}

export async function getGlobalLeaderboard(limit: number = 50): Promise<LeaderboardEntryWithProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
  
  return (data || []).map((profile, index) => ({
    rank: index + 1,
    points: profile.total_points || 0,
    profile: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      country: profile.country,
      tier: profile.tier || getTierFromPoints(profile.total_points || 0),
      total_points: profile.total_points,
      current_streak: profile.current_streak,
      accuracy: profile.accuracy,
      total_quizzes_completed: profile.total_quizzes_completed,
    },
  }));
}

export async function getCountryLeaderboard(
  countryCode: string, 
  limit: number = 50
): Promise<LeaderboardEntryWithProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('country', countryCode)
    .order('total_points', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching country leaderboard:', error);
    throw error;
  }
  
  return (data || []).map((profile, index) => ({
    rank: index + 1,
    points: profile.total_points || 0,
    profile: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      country: profile.country,
      tier: profile.tier || getTierFromPoints(profile.total_points || 0),
      total_points: profile.total_points,
      current_streak: profile.current_streak,
      accuracy: profile.accuracy,
      total_quizzes_completed: profile.total_quizzes_completed,
    },
  }));
}

export async function getUserRank(userId: string): Promise<{ rank: number; total_points: number; percentile: number } | null> {
  const { data, error } = await supabase.rpc('get_user_rank', {
    user_uuid: userId,
  });
  
  if (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    return {
      rank: Number(data[0].rank),
      total_points: data[0].total_points,
      percentile: Number(data[0].percentile),
    };
  }
  
  return null;
}

export async function getUserProfile(userId: string): Promise<LeaderboardProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    country: data.country,
    tier: data.tier || getTierFromPoints(data.total_points || 0),
    total_points: data.total_points,
    current_streak: data.current_streak,
    accuracy: data.accuracy,
    total_quizzes_completed: data.total_quizzes_completed,
  };
}

export async function updateUserProfile(
  userId: string, 
  updates: Partial<{
    username: string;
    display_name: string;
    avatar_url: string;
    country: string;
  }>
): Promise<LeaderboardProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  
  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    country: data.country,
    tier: data.tier || getTierFromPoints(data.total_points || 0),
    total_points: data.total_points,
    current_streak: data.current_streak,
    accuracy: data.accuracy,
    total_quizzes_completed: data.total_quizzes_completed,
  };
}
