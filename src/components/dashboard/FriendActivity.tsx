import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  username: string;
  avatar_url: string | null;
  action: string;
  time: string;
}

export const FriendActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    loadActivity();
  }, [user?.id]);

  const loadActivity = async () => {
    // Get friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user!.id)
      .limit(20);

    if (!friendships?.length) return;

    const friendIds = friendships.map(f => f.friend_id);

    // Get recent quiz sessions from friends
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('user_id, score, subject_name, completed_at')
      .in('user_id', friendIds)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (!sessions?.length) return;

    // Get profiles for those users
    const userIds = [...new Set(sessions.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const items: ActivityItem[] = sessions.map(s => {
      const p = profileMap.get(s.user_id);
      const timeAgo = getTimeAgo(s.completed_at!);
      return {
        id: s.user_id + s.completed_at,
        username: p?.username || 'User',
        avatar_url: p?.avatar_url || null,
        action: `scored ${s.score} in ${s.subject_name || 'Quiz'}`,
        time: timeAgo,
      };
    });

    setActivities(items.slice(0, 4));
  };

  if (activities.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Friend Activity</h3>
        <Link to="/friends" className="text-xs text-primary font-medium flex items-center gap-0.5">
          See all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {activities.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7">
              {item.avatar_url && <AvatarImage src={item.avatar_url} />}
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                {item.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">
                <span className="font-semibold">{item.username}</span>{' '}
                <span className="text-muted-foreground">{item.action}</span>
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
