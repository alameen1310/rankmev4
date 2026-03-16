import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Zap, Swords, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/pvp', icon: Swords, label: 'PvP' },
  { to: '/quiz', icon: Zap, label: 'Quiz' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadUnread = async () => {
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setUnreadMessages(count || 0);
    };

    loadUnread();

    const channel = supabase
      .channel(`unread:friends:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => loadUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="max-w-lg mx-auto">
          <div
            className="flex items-center justify-around h-14"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
              const showUnread = label === 'Friends' && unreadMessages > 0;

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg',
                    'min-w-[56px] min-h-[44px] transition-all duration-150',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground active:scale-90',
                  )}
                >
                  <div className={cn(
                    "relative transition-transform duration-150",
                    isActive && "scale-110"
                  )}>
                    <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                    {showUnread && (
                      <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px]',
                    isActive ? 'font-bold' : 'font-medium',
                  )}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-4 h-0.5 rounded-full bg-primary" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-14 bottom-0 w-56 z-40 bg-background border-r border-border flex-col py-4 px-2 gap-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
          const showUnread = label === 'Friends' && unreadMessages > 0;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showUnread && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
