import { supabase } from '@/integrations/supabase/client';

export interface SuggestedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  tier: string | null;
  total_points: number | null;
  equipped_title: string | null;
  showcase_badges: string[] | null;
  matchReason: string;
}

export async function getFriendSuggestions(): Promise<SuggestedUser[]> {
  try {
    const { data, error } = await supabase.functions.invoke('friend-suggestions', {
      body: {},
    });

    if (error) {
      console.error('Error fetching friend suggestions:', error);
      return [];
    }

    return data?.suggestions || [];
  } catch (error) {
    console.error('Failed to get friend suggestions:', error);
    return [];
  }
}

export async function dismissSuggestion(userId: string): Promise<void> {
  try {
    // Store dismissed suggestion locally
    const dismissed = JSON.parse(localStorage.getItem('dismissed-suggestions') || '[]');
    dismissed.push({ id: userId, at: Date.now() });
    localStorage.setItem('dismissed-suggestions', JSON.stringify(dismissed));

    // Also try to notify server (optional)
    await supabase.functions.invoke('friend-suggestions', {
      body: { userId },
    });
  } catch (error) {
    console.error('Error dismissing suggestion:', error);
  }
}

export function getFilteredSuggestions(suggestions: SuggestedUser[]): SuggestedUser[] {
  const dismissed = JSON.parse(localStorage.getItem('dismissed-suggestions') || '[]');
  const dismissedIds = new Set(dismissed.map((d: { id: string }) => d.id));
  
  // Filter out dismissed suggestions (that were dismissed less than 7 days ago)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyDismissedIds = new Set(
    dismissed
      .filter((d: { at: number }) => d.at > sevenDaysAgo)
      .map((d: { id: string }) => d.id)
  );

  return suggestions.filter(s => !recentlyDismissedIds.has(s.id));
}
