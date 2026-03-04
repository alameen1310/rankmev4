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
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 lg:hidden">
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

      {/* Desktop sidebar nav */}
      <nav className="hidden lg:flex fixed left-0 top-[56px] bottom-0 w-60 z-40 glass-strong border-r border-border/50 flex-col py-6 px-3 gap-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
          
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 game-tap",
                isActive 
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]")} />
              <span className="text-sm">{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
