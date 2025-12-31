import { supabase } from '@/integrations/supabase/client';
import type { Tier, LeaderboardEntry } from '@/types';

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

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  'US': '🇺🇸', 'GB': '🇬🇧', 'NG': '🇳🇬', 'GH': '🇬🇭', 'KE': '🇰🇪',
  'ZA': '🇿🇦', 'IN': '🇮🇳', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
  'FR': '🇫🇷', 'MX': '🇲🇽', 'BR': '🇧🇷', 'JP': '🇯🇵', 'CN': '🇨🇳',
};

export function getTierFromPoints(points: number): Tier {
  if (points >= 50000) return 'champion';
  if (points >= 30000) return 'diamond';
  if (points >= 15000) return 'platinum';
  if (points >= 7500) return 'gold';
  if (points >= 3000) return 'silver';
  return 'bronze';
}

function getCountryFlag(countryCode: string | null): string {
  if (!countryCode) return '🌍';
  return countryFlags[countryCode.toUpperCase()] || '🌍';
}

// Convert database profile to LeaderboardEntry format for UI
function profileToLeaderboardEntry(
  profile: LeaderboardProfile, 
  rank: number,
  previousRank?: number
): LeaderboardEntry {
  const change: 'up' | 'down' | 'same' = previousRank 
    ? (rank < previousRank ? 'up' : rank > previousRank ? 'down' : 'same')
    : 'same';
  
  return {
    id: profile.id,
    rank,
    username: profile.display_name || profile.username || 'Anonymous',
    avatar: profile.avatar_url || undefined,
    points: profile.total_points || 0,
    tier: (profile.tier as Tier) || getTierFromPoints(profile.total_points || 0),
    country: profile.country || 'Unknown',
    countryFlag: getCountryFlag(profile.country),
    change,
    changeAmount: previousRank ? Math.abs(rank - previousRank) : undefined,
  };
}

export async function getGlobalLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  // Fetch from profiles ordered by total_points (real global leaderboard)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .gt('total_points', 0)
    .order('total_points', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return getFallbackLeaderboard();
  }
  
  const profiles = data || [];
  
  // If no real users, show fallback
  if (profiles.length === 0) {
    return getFallbackLeaderboard();
  }
  
  return profiles.map((profile, index) => profileToLeaderboardEntry({
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    country: profile.country,
    tier: profile.tier || getTierFromPoints(profile.total_points || 0),
    total_points: profile.total_points,
    current_streak: profile.current_streak,
    accuracy: profile.accuracy ? Number(profile.accuracy) : null,
    total_quizzes_completed: profile.total_quizzes_completed,
  }, index + 1));
}

export async function getWeeklyLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .gt('weekly_points', 0)
    .order('weekly_points', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return [];
  }
  
  return (data || []).map((profile, index) => profileToLeaderboardEntry({
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    country: profile.country,
    tier: profile.tier || getTierFromPoints(profile.weekly_points || 0),
    total_points: profile.weekly_points, // Use weekly_points for weekly leaderboard
    current_streak: profile.current_streak,
    accuracy: profile.accuracy ? Number(profile.accuracy) : null,
    total_quizzes_completed: profile.total_quizzes_completed,
  }, index + 1));
}

export async function getCountryLeaderboard(
  countryCode: string, 
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('country', countryCode)
    .gt('total_points', 0)
    .order('total_points', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching country leaderboard:', error);
    return [];
  }
  
  return (data || []).map((profile, index) => profileToLeaderboardEntry({
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    country: profile.country,
    tier: profile.tier || getTierFromPoints(profile.total_points || 0),
    total_points: profile.total_points,
    current_streak: profile.current_streak,
    accuracy: profile.accuracy ? Number(profile.accuracy) : null,
    total_quizzes_completed: profile.total_quizzes_completed,
  }, index + 1));
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
    accuracy: data.accuracy ? Number(data.accuracy) : null,
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
    accuracy: data.accuracy ? Number(data.accuracy) : null,
    total_quizzes_completed: data.total_quizzes_completed,
  };
}

// Fallback leaderboard when database is empty
function getFallbackLeaderboard(): LeaderboardEntry[] {
  const dummyUsers = [
    { id: '1', username: 'Alex Johnson', country: 'US', tier: 'champion' as Tier, total_points: 60413 },
    { id: '2', username: 'Sophia Williams', country: 'GB', tier: 'diamond' as Tier, total_points: 59210 },
    { id: '3', username: 'Marcus Lee', country: 'DE', tier: 'diamond' as Tier, total_points: 58258 },
    { id: '4', username: 'Emma Watson', country: 'GH', tier: 'platinum' as Tier, total_points: 57129 },
    { id: '5', username: 'James Chen', country: 'DE', tier: 'gold' as Tier, total_points: 55715 },
    { id: '6', username: 'Olivia Smith', country: 'AU', tier: 'gold' as Tier, total_points: 54754 },
    { id: '7', username: 'Noah Brown', country: 'NG', tier: 'silver' as Tier, total_points: 53433 },
    { id: '8', username: 'Ava Miller', country: 'CA', tier: 'silver' as Tier, total_points: 51200 },
    { id: '9', username: 'Liam Davis', country: 'FR', tier: 'silver' as Tier, total_points: 48500 },
    { id: '10', username: 'Isabella Garcia', country: 'MX', tier: 'bronze' as Tier, total_points: 45000 },
  ];
  
  return dummyUsers.map((user, index) => ({
    id: user.id,
    rank: index + 1,
    username: user.username,
    points: user.total_points,
    tier: user.tier,
    country: user.country,
    countryFlag: getCountryFlag(user.country),
    change: 'same' as const,
  }));
}
