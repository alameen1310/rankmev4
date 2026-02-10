import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Zap, Swords, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/pvp', icon: Swords, label: 'PvP' },
  { to: '/quiz', icon: Zap, label: 'Quiz' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50">
      <div className="max-w-lg mx-auto">
        <div 
          className="flex items-center justify-around h-16"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
            
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200",
                  "min-w-[64px] min-h-[48px] touch-target game-tap",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActive && "scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]"
                    )} 
                  />
                  {isActive && (
                    <>
                      <div className="absolute -inset-2 bg-primary/15 rounded-full blur-lg -z-10 animate-pulse-slow" />
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    </>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
