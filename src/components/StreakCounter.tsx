import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export const StreakCounter = ({ streak, className }: StreakCounterProps) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  
  // Calculate which days have been completed based on streak
  const completedDays = new Array(7).fill(false);
  for (let i = 0; i < Math.min(streak, 7); i++) {
    const dayIndex = (today - i + 7) % 7;
    completedDays[dayIndex] = true;
  }

  return (
    <div className={cn("glass rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Flame className={cn(
              "h-8 w-8",
              streak > 0 ? "text-warning animate-streak-fire" : "text-muted-foreground"
            )} />
            {streak > 0 && (
              <div className="absolute inset-0 bg-warning/30 rounded-full blur-md" />
            )}
          </div>
          <div>
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>
        
        {streak >= 7 && (
          <div className="flex items-center gap-1 text-warning">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-semibold">On Fire!</span>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-1">
        {days.map((day, index) => {
          const isCompleted = completedDays[index];
          const isToday = index === today;
          
          return (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center gap-1"
              )}
            >
              <span className="text-xs text-muted-foreground">{day}</span>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isCompleted 
                    ? "bg-warning text-warning-foreground" 
                    : "bg-muted",
                  isToday && !isCompleted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {isCompleted && <span className="text-sm">✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3">
        {streak === 0 
          ? "Start studying to begin your streak!" 
          : streak === 1 
            ? "Great start! Come back tomorrow to continue."
            : `Amazing! You've studied ${streak} days in a row!`
        }
      </p>
    </div>
  );
};
