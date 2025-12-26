import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Zap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { to: '/quiz', icon: Zap, label: 'Quiz' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe-bottom">
      <div className="container">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
            
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 touch-target",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-transform",
                      isActive && "scale-110"
                    )} 
                  />
                  {isActive && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md -z-10 animate-pulse-ring" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
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
