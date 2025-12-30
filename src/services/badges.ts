import { supabase } from '@/integrations/supabase/client';

export interface DbBadge {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  requirement_type: string | null;
  requirement_value: number | null;
  tier: string | null;
}

export interface UserBadge {
  badge: DbBadge;
  earned_at: string;
}

export async function getAllBadges(): Promise<DbBadge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true });
  
  if (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
  
  return data || [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      earned_at,
      badges (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
  
  return (data || []).map((item: any) => ({
    badge: item.badges,
    earned_at: item.earned_at,
  }));
}

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const { error } = await supabase.rpc('check_and_award_badges', {
    user_uuid: userId,
  });
  
  if (error) {
    console.error('Error checking badges:', error);
  }
}
