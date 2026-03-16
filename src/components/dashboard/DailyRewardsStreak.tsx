import { Check, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { WEEKLY_REWARDS } from '@/services/gamification';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Confetti } from '@/components/Confetti';

export const DailyRewardsStreak = () => {
  const { streak, todayClaimed, claimDailyReward } = useDailyRewards();
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const currentWeekDay = (streak % 7) || 7;

  const handleClaim = async () => {
    if (todayClaimed || claiming) return;
    setClaiming(true);
    const reward = await claimDailyReward();
    if (reward) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setClaiming(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <Confetti isActive={showConfetti} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold">Daily Streak</h3>
          <span className="text-xs font-bold text-warning">🔥 {streak}d</span>
        </div>
        {!todayClaimed && (
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={claiming}
            className="h-7 text-xs px-3 bg-warning text-warning-foreground hover:bg-warning/90 game-tap"
          >
            {claiming ? '...' : 'Claim'}
          </Button>
        )}
      </div>

      {/* 7-day tracker */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKLY_REWARDS.map((reward, i) => {
          const day = i + 1;
          const claimed = day < currentWeekDay || (day === currentWeekDay && todayClaimed);
          const isToday = day === currentWeekDay && !todayClaimed;
          const locked = day > currentWeekDay;

          return (
            <div
              key={day}
              className={cn(
                "flex flex-col items-center py-1.5 rounded-lg text-center",
                claimed && "bg-success/10",
                isToday && "bg-warning/10 ring-1 ring-warning/50",
                locked && "opacity-40"
              )}
            >
              <span className="text-[9px] text-muted-foreground mb-0.5">D{day}</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm">
                {claimed ? (
                  <Check className="h-3 w-3 text-success" />
                ) : locked ? (
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                ) : (
                  <span className="text-xs">{reward.icon}</span>
                )}
              </div>
              <span className="text-[8px] font-medium mt-0.5">
                {reward.reward.type === 'points' ? `+${reward.reward.value}` : '⚡'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
