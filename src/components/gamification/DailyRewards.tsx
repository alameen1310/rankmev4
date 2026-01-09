import { useState, useEffect } from 'react';
import { Gift, Clock, Sparkles, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WEEKLY_REWARDS, rollMysteryBox, type MysteryBoxReward, RARITY_COLORS } from '@/services/gamification';
import { useStreak } from '@/hooks/useStreak';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/Confetti';
import { toast } from '@/hooks/use-toast';

interface DailyRewardsProps {
  className?: string;
}

export const DailyRewards = ({ className }: DailyRewardsProps) => {
  const { streakData, claimDailyReward, getNextReward, isUpdating } = useStreak();
  const [showConfetti, setShowConfetti] = useState(false);
  const [mysteryBoxAvailable, setMysteryBoxAvailable] = useState(true);
  const [mysteryBoxCooldown, setMysteryBoxCooldown] = useState<Date | null>(null);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [boxReward, setBoxReward] = useState<MysteryBoxReward | null>(null);

  // Check mystery box cooldown from localStorage
  useEffect(() => {
    const savedCooldown = localStorage.getItem('mysteryBoxCooldown');
    if (savedCooldown) {
      const cooldownDate = new Date(savedCooldown);
      if (cooldownDate > new Date()) {
        setMysteryBoxCooldown(cooldownDate);
        setMysteryBoxAvailable(false);
      } else {
        localStorage.removeItem('mysteryBoxCooldown');
      }
    }
  }, []);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<string>('');
  useEffect(() => {
    if (!mysteryBoxCooldown) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = mysteryBoxCooldown.getTime() - now.getTime();

      if (diff <= 0) {
        setMysteryBoxAvailable(true);
        setMysteryBoxCooldown(null);
        localStorage.removeItem('mysteryBoxCooldown');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [mysteryBoxCooldown]);

  const handleClaimDaily = async () => {
    const reward = await claimDailyReward();
    if (reward) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const handleOpenMysteryBox = async () => {
    if (!mysteryBoxAvailable || isOpeningBox) return;

    setIsOpeningBox(true);
    
    // Simulate box opening animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const reward = rollMysteryBox();
    setBoxReward(reward);
    setShowConfetti(true);
    
    // Apply reward
    if (reward.type === 'points') {
      toast({
        title: `🎉 You won ${reward.value} points!`,
        description: `Rarity: ${reward.rarity.toUpperCase()}`,
      });
    } else if (reward.type === 'xpBoost') {
      toast({
        title: `⚡ XP Boost activated!`,
        description: `${reward.value}x XP for the next hour!`,
      });
    } else if (reward.type === 'badge') {
      toast({
        title: `🏅 New badge unlocked!`,
        description: `You earned the ${reward.value} badge!`,
      });
    }

    // Set cooldown (24 hours)
    const cooldownDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setMysteryBoxCooldown(cooldownDate);
    setMysteryBoxAvailable(false);
    localStorage.setItem('mysteryBoxCooldown', cooldownDate.toISOString());

    setTimeout(() => {
      setShowConfetti(false);
      setBoxReward(null);
      setIsOpeningBox(false);
    }, 3000);
  };

  const currentWeekDay = (streakData.currentStreak % 7) || 7;
  const nextReward = getNextReward();

  return (
    <div className={cn("space-y-4", className)}>
      {showConfetti && <Confetti />}

      {/* Daily Login Streak */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Daily Rewards</h3>
              <p className="text-xs text-muted-foreground">
                Day {currentWeekDay} of 7
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={handleClaimDaily}
            disabled={streakData.todayClaimed || isUpdating}
            className={cn(
              "transition-all",
              streakData.todayClaimed 
                ? "bg-success/20 text-success" 
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {streakData.todayClaimed ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Claimed
              </>
            ) : isUpdating ? (
              'Claiming...'
            ) : (
              'Claim'
            )}
          </Button>
        </div>

        {/* Weekly Progress */}
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKLY_REWARDS.map((reward, index) => {
            const dayNum = index + 1;
            const isClaimed = dayNum < currentWeekDay || (dayNum === currentWeekDay && streakData.todayClaimed);
            const isToday = dayNum === currentWeekDay && !streakData.todayClaimed;
            const isLocked = dayNum > currentWeekDay;

            return (
              <div
                key={dayNum}
                className={cn(
                  "relative flex flex-col items-center p-2 rounded-lg transition-all",
                  isClaimed && "bg-success/20",
                  isToday && "bg-primary/20 ring-2 ring-primary ring-offset-1",
                  isLocked && "opacity-50",
                  reward.isSpecial && "bg-gradient-to-br from-warning/20 to-orange-500/20"
                )}
              >
                <span className="text-[10px] text-muted-foreground mb-1">
                  Day {dayNum}
                </span>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-lg",
                  isClaimed && "bg-success/30",
                  isToday && "bg-primary/30 animate-pulse",
                  reward.isSpecial && "ring-2 ring-warning/50"
                )}>
                  {isClaimed ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : isLocked ? (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    reward.icon
                  )}
                </div>
                <span className="text-[9px] mt-1 text-center">
                  {reward.reward.type === 'points' ? (
                    `+${reward.reward.value}`
                  ) : (
                    'Boost'
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {nextReward && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            Next milestone reward in {nextReward.daysUntil} day{nextReward.daysUntil > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Mystery Box */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Daily Mystery Box</h3>
        </div>

        <div className="flex items-center justify-between">
          {mysteryBoxAvailable ? (
            <button
              onClick={handleOpenMysteryBox}
              disabled={isOpeningBox}
              className={cn(
                "flex-1 py-6 rounded-xl bg-gradient-to-br from-primary/20 via-warning/20 to-primary/20",
                "flex flex-col items-center gap-2 transition-all",
                "hover:scale-[1.02] hover:shadow-lg",
                isOpeningBox && "animate-bounce"
              )}
            >
              <span className={cn(
                "text-5xl transition-transform",
                isOpeningBox && "animate-spin"
              )}>
                🎁
              </span>
              <span className="text-sm font-medium">
                {isOpeningBox ? 'Opening...' : 'Tap to Open!'}
              </span>
            </button>
          ) : (
            <div className="flex-1 py-6 rounded-xl bg-muted/50 flex flex-col items-center gap-2">
              <span className="text-5xl opacity-50">🎁</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">{timeLeft}</span>
              </div>
              <span className="text-xs text-muted-foreground">until next box</span>
            </div>
          )}
        </div>

        {boxReward && (
          <div 
            className="mt-3 p-3 rounded-lg text-center animate-fade-in"
            style={{ backgroundColor: `${RARITY_COLORS[boxReward.rarity]}20` }}
          >
            <span className="text-xs font-semibold uppercase" style={{ color: RARITY_COLORS[boxReward.rarity] }}>
              {boxReward.rarity} Reward!
            </span>
            <p className="text-lg font-bold mt-1">
              {boxReward.type === 'points' && `+${boxReward.value} Points`}
              {boxReward.type === 'xpBoost' && `${boxReward.value}x XP Boost`}
              {boxReward.type === 'badge' && `🏅 ${boxReward.value}`}
            </p>
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Contains: Points, XP Boosts, Badges & more!
        </p>
      </div>
    </div>
  );
};
