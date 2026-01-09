import { useState, useEffect } from 'react';
import { Crown, ChevronRight, Lock, Check } from 'lucide-react';
import { TITLES, type Title } from '@/services/gamification';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface TitleSelectorProps {
  className?: string;
}

export const TitleSelector = ({ className }: TitleSelectorProps) => {
  const { profile } = useAuth();
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [activeTitle, setActiveTitle] = useState<Title | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Title['category'] | 'all'>('all');

  // Calculate earned titles based on user stats
  const earnedTitleIds = TITLES.filter(title => {
    if (!profile) return false;
    
    switch (title.requirement.type) {
      case 'points':
        return profile.total_points >= title.requirement.value;
      case 'streak':
        return profile.current_streak >= title.requirement.value;
      case 'quizzes':
        return profile.total_quizzes_completed >= title.requirement.value;
      case 'accuracy':
        return profile.accuracy >= title.requirement.value;
      default:
        return false;
    }
  }).map(t => t.id);

  // Set initial active title
  useEffect(() => {
    const savedTitleId = localStorage.getItem('activeTitle');
    if (savedTitleId) {
      const title = TITLES.find(t => t.id === savedTitleId);
      if (title && earnedTitleIds.includes(title.id)) {
        setActiveTitle(title);
      }
    } else if (earnedTitleIds.length > 0) {
      setActiveTitle(TITLES.find(t => t.id === earnedTitleIds[0]) || null);
    }
  }, [earnedTitleIds]);

  const categories: { id: Title['category'] | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'subject', label: 'Subjects', icon: '📚' },
    { id: 'achievement', label: 'Achievements', icon: '🏆' },
    { id: 'streak', label: 'Streaks', icon: '🔥' },
    { id: 'special', label: 'Special', icon: '⭐' },
  ];

  const filteredTitles = TITLES.filter(title => 
    selectedCategory === 'all' || title.category === selectedCategory
  );

  const handleApplyTitle = () => {
    if (!selectedTitle) return;
    
    if (!earnedTitleIds.includes(selectedTitle.id)) {
      toast({
        title: "Title Locked",
        description: "Complete the requirements to unlock this title!",
        variant: "destructive",
      });
      return;
    }

    setActiveTitle(selectedTitle);
    localStorage.setItem('activeTitle', selectedTitle.id);
    setDialogOpen(false);
    
    toast({
      title: `${selectedTitle.icon} Title Updated!`,
      description: `You are now "${selectedTitle.name}"`,
    });
  };

  // Get next title to unlock
  const nextTitle = TITLES.find(t => 
    !earnedTitleIds.includes(t.id) && 
    t.requirement.type === 'points' &&
    profile && t.requirement.value > profile.total_points
  );

  return (
    <div className={cn("glass rounded-xl p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
            {activeTitle?.icon || '👤'}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Title</p>
            <h3 className="font-semibold">
              {activeTitle?.name || 'No Title'}
            </h3>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              Change
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-warning" />
                Select Your Title
              </DialogTitle>
            </DialogHeader>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto py-2 -mx-2 px-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    "flex items-center gap-1",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Titles List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {filteredTitles.map(title => {
                const isEarned = earnedTitleIds.includes(title.id);
                const isSelected = selectedTitle?.id === title.id;
                const isActive = activeTitle?.id === title.id;

                return (
                  <button
                    key={title.id}
                    onClick={() => setSelectedTitle(title)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      isSelected && "ring-2 ring-primary",
                      isEarned 
                        ? "bg-card hover:bg-accent" 
                        : "bg-muted/50 opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                      isEarned ? "bg-primary/20" : "bg-muted"
                    )}>
                      {isEarned ? title.icon : <Lock className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-semibold text-sm",
                          !isEarned && "text-muted-foreground"
                        )}>
                          {title.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success font-medium">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {title.description}
                      </p>
                    </div>

                    {isEarned && isSelected && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Apply Button */}
            <div className="pt-3 border-t">
              <Button 
                className="w-full" 
                onClick={handleApplyTitle}
                disabled={!selectedTitle || !earnedTitleIds.includes(selectedTitle.id)}
              >
                Apply Title
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Next Title Progress */}
      {nextTitle && profile && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Next Title</span>
            <span className="text-xs flex items-center gap-1">
              {nextTitle.icon} {nextTitle.name}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ 
                width: `${Math.min((profile.total_points / nextTitle.requirement.value) * 100, 100)}%` 
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {nextTitle.requirement.value - profile.total_points} points needed
          </p>
        </div>
      )}

      {/* Earned Titles Count */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Titles Earned</span>
        <span className="font-medium">{earnedTitleIds.length}/{TITLES.length}</span>
      </div>
    </div>
  );
};
