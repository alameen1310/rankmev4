import { useState, useEffect } from 'react';
import { Gift, Clock, Sparkles, Check, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WEEKLY_REWARDS, RARITY_COLORS, rollMysteryBox, type MysteryBoxReward } from '@/services/gamification';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/Confetti';
import { toast } from '@/hooks/use-toast';

interface DailyRewardsProps {
  className?: string;
}

export const DailyRewards = ({ className }: DailyRewardsProps) => {
  const { 
    streak, 
    weekProgress, 
    todayClaimed, 
    claimDailyReward,
    getTimeUntilReset,
  } = useDailyRewards();
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClaming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Mystery box state
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

  // Mystery box countdown timer
  const [boxTimeLeft, setBoxTimeLeft] = useState<string>('');
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

      setBoxTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [mysteryBoxCooldown]);

  // Daily reward countdown timer
  useEffect(() => {
    if (!todayClaimed) return;

    const timer = setInterval(() => {
      const reset = getTimeUntilReset();
      if (reset) {
        setTimeLeft(`${reset.hours.toString().padStart(2, '0')}:${reset.minutes.toString().padStart(2, '0')}:${reset.seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayClaimed, getTimeUntilReset]);

  const handleClaimDaily = async () => {
    if (todayClaimed || isClaming) return;
    
    setIsClaiming(true);
    const reward = await claimDailyReward();
    if (reward) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    setIsClaiming(false);
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

  const currentWeekDay = (streak % 7) || 7;

  return (
    <div className={cn("space-y-4", className)}>
      <Confetti isActive={showConfetti} />

      {/* Daily Login Streak */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Daily Rewards</h3>
              <div className="flex items-center gap-1">
                <span className="text-2xl">🔥</span>
                <span className="text-xs font-bold text-warning">{streak} day streak</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {todayClaimed ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-success">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">Claimed!</span>
                </div>
                {timeLeft && (
                  <p className="text-[10px] text-muted-foreground">
                    Next in {timeLeft}
                  </p>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleClaimDaily}
                disabled={isClaming}
                className="bg-gradient-to-r from-warning to-orange-500 hover:from-warning/90 hover:to-orange-500/90 text-white animate-pulse"
              >
                {isClaming ? 'Claiming...' : 'Claim Reward!'}
              </Button>
            )}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKLY_REWARDS.map((reward, index) => {
            const dayNum = index + 1;
            const isClaimed = dayNum < currentWeekDay || (dayNum === currentWeekDay && todayClaimed);
            const isToday = dayNum === currentWeekDay && !todayClaimed;
            const isLocked = dayNum > currentWeekDay;

            return (
              <div
                key={dayNum}
                className={cn(
                  "relative flex flex-col items-center p-2 rounded-lg transition-all",
                  isClaimed && "bg-success/20",
                  isToday && "bg-gradient-to-br from-warning/30 to-orange-500/30 ring-2 ring-warning ring-offset-1 ring-offset-background",
                  isLocked && "opacity-50",
                  reward.isSpecial && !isClaimed && !isToday && "bg-gradient-to-br from-primary/10 to-warning/10"
                )}
              >
                <span className="text-[10px] text-muted-foreground mb-1">
                  Day {dayNum}
                </span>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-lg relative",
                  isClaimed && "bg-success/30",
                  isToday && "bg-warning/30 animate-pulse",
                  reward.isSpecial && "ring-2 ring-warning/50"
                )}>
                  {isClaimed ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : isLocked ? (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <>
                      {reward.icon}
                      {reward.isSpecial && (
                        <Star className="h-2.5 w-2.5 text-warning absolute -top-0.5 -right-0.5 fill-warning" />
                      )}
                    </>
                  )}
                </div>
                <span className="text-[9px] mt-1 text-center font-medium">
                  {reward.reward.type === 'points' ? (
                    `+${reward.reward.value}`
                  ) : (
                    <span className="text-primary">Boost</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Streak milestone hint */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {streak >= 7 ? '🏆 Weekly streak complete!' : `${7 - (streak % 7)} days to weekly bonus`}
            </span>
            <span className="font-bold text-warning">+500 pts</span>
          </div>
        </div>
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
                "hover:scale-[1.02] hover:shadow-lg hover:from-primary/30 hover:via-warning/30 hover:to-primary/30",
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
                <span className="text-sm font-mono">{boxTimeLeft}</span>
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
