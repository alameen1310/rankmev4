import { useState, useEffect } from 'react';
import { Gift, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollMysteryBox, RARITY_COLORS, type MysteryBoxReward } from '@/services/gamification';
import { Confetti } from '@/components/Confetti';
import { toast } from '@/hooks/use-toast';

export const MysteryBoxCard = () => {
  const [available, setAvailable] = useState(true);
  const [cooldown, setCooldown] = useState<Date | null>(null);
  const [opening, setOpening] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mysteryBoxCooldown');
    if (saved) {
      const d = new Date(saved);
      if (d > new Date()) {
        setCooldown(d);
        setAvailable(false);
      } else {
        localStorage.removeItem('mysteryBoxCooldown');
      }
    }
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => {
      const diff = cooldown.getTime() - Date.now();
      if (diff <= 0) {
        setAvailable(true);
        setCooldown(null);
        localStorage.removeItem('mysteryBoxCooldown');
        clearInterval(timer);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const [showConfetti, setShowConfetti] = useState(false);

  const handleOpen = async () => {
    if (!available || opening) return;
    setOpening(true);
    await new Promise(r => setTimeout(r, 1200));
    const reward = rollMysteryBox();
    setShowConfetti(true);

    toast({
      title: reward.type === 'points' ? `🎉 +${reward.value} Points!` :
             reward.type === 'xpBoost' ? `⚡ ${reward.value}x XP Boost!` :
             `🏅 Badge: ${reward.value}`,
      description: `${reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)} reward`,
    });

    const cd = new Date(Date.now() + 24 * 3600000);
    setCooldown(cd);
    setAvailable(false);
    localStorage.setItem('mysteryBoxCooldown', cd.toISOString());

    setTimeout(() => {
      setShowConfetti(false);
      setOpening(false);
    }, 2500);
  };

  return (
    <>
      <Confetti isActive={showConfetti} />
      <button
        onClick={handleOpen}
        disabled={!available || opening}
        className={cn(
          "bg-card border border-border rounded-xl p-4 w-full text-left game-tap transition-all",
          available && "hover:border-primary/30 hover:shadow-md",
          opening && "animate-shake"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center text-2xl",
            available ? "bg-primary/10" : "bg-muted"
          )}>
            🎁
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {opening ? 'Opening...' : 'Mystery Box'}
            </p>
            <p className="text-xs text-muted-foreground">
              {available
                ? 'Tap to open — free daily reward!'
                : `Next box in ${timeLeft}`}
            </p>
          </div>
          {!available && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </button>
    </>
  );
};
