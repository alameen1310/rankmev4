import { Link } from 'react-router-dom';
import { Bell, Sun, Moon, Trophy } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { profile, isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50 safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Trophy className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            RankMe
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-10 w-10 touch-target"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-warning" />
            )}
          </Button>

          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 relative touch-target">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              <Link to="/profile">
                <Avatar className="h-9 w-9 border-2 border-primary/50 transition-all hover:border-primary hover:scale-105">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {profile?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <Link to="/login">
              <Button size="sm" className="h-9 touch-target">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};