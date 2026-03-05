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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => loadUnread(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 lg:hidden">
        <div className="max-w-lg mx-auto">
          <div
            className="flex items-center justify-around h-16"
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
                    'flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200',
                    'min-w-[64px] min-h-[48px] touch-target game-tap',
                    isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        'h-6 w-6 transition-all duration-200',
                        isActive && 'scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]',
                      )}
                    />
                    {showUnread && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                    {isActive && (
                      <>
                        <div className="absolute -inset-2 bg-primary/15 rounded-full blur-lg -z-10 animate-pulse-slow" />
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      </>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-all duration-200',
                      isActive && 'font-semibold',
                    )}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <nav className="hidden lg:flex fixed left-0 top-[56px] bottom-0 w-60 z-40 glass-strong border-r border-border/50 flex-col py-6 px-3 gap-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
          const showUnread = label === 'Friends' && unreadMessages > 0;

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 game-tap',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]')} />
                {showUnread && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-sm">{label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
