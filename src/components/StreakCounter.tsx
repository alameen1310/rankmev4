import { Flame, Check } from 'lucide-react';
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
    <div className={cn("glass rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              streak > 0 ? "bg-warning/15" : "bg-muted"
            )}>
              <Flame className={cn(
                "h-6 w-6",
                streak > 0 ? "text-warning animate-streak-fire" : "text-muted-foreground"
              )} />
            </div>
            {streak > 0 && (
              <div className="absolute inset-0 bg-warning/20 rounded-full blur-md animate-pulse-slow" />
            )}
          </div>
          <div>
            <div className="text-3xl font-bold leading-none">{streak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
        </div>
        
        {streak >= 7 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/15">
            <span className="text-base">🔥</span>
            <span className="text-sm font-semibold text-warning">On Fire!</span>
          </div>
        )}
      </div>

      {/* Calendar Grid - Fixed 7 columns */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCompleted = completedDays[index];
          const isToday = index === today;
          
          return (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted 
                    ? "bg-warning text-warning-foreground shadow-sm" 
                    : "bg-muted/60",
                  isToday && !isCompleted && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                )}
              >
                {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        {streak === 0 
          ? "Start studying to begin your streak!" 
          : streak === 1 
            ? "Great start! Come back tomorrow."
            : `Amazing! ${streak} days in a row!`
        }
      </p>
    </div>
  );
};