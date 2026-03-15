import { Flame, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export const StreakCounter = ({ streak, className }: StreakCounterProps) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  const completedDays = new Array(7).fill(false);
  for (let i = 0; i < Math.min(streak, 7); i++) {
    const dayIndex = (today - i + 7) % 7;
    completedDays[dayIndex] = true;
  }

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Flame className={cn("h-5 w-5", streak > 0 ? "text-warning" : "text-muted-foreground")} />
          <div>
            <span className="text-2xl font-bold">{streak}</span>
            <span className="text-sm text-muted-foreground ml-1.5">day streak</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const isCompleted = completedDays[index];
          const isToday = index === today;

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                isCompleted
                  ? "bg-warning text-warning-foreground"
                  : "bg-secondary",
                isToday && !isCompleted && "ring-2 ring-primary ring-offset-1 ring-offset-background"
              )}>
                {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
