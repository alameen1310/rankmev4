import { Link } from 'react-router-dom';
import { Bell, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGameState } from '@/contexts/GameStateContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, profile } = useAuth();
  const { unreadCount } = useGameState();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto lg:pl-64">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-primary">RankMe</span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Sun className="h-4 w-4 text-warning" />
            )}
          </Button>

          {isAuthenticated && (
            <>
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
                  <Bell className="h-4 w-4 text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/profile">
                <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer game-tap min-w-[44px] min-h-[44px] flex items-center justify-center">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile?.username || 'User'} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(profile?.username || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
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
