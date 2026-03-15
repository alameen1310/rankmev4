import { Link } from 'react-router-dom';
import { Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameState } from '@/contexts/GameStateContext';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useGameState();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto lg:pl-64">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-tight">RankMe</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-warning" />
            )}
          </Button>

          {isAuthenticated && (
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {!isAuthenticated && (
            <Link to="/login">
              <Button size="sm" className="h-8 text-xs">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
