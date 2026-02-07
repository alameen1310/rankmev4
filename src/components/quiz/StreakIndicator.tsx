import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StreakIndicatorProps {
  streak: number;
  show: boolean;
}

const STREAK_MESSAGES = [
  { min: 3, text: 'ON FIRE 🔥', color: 'text-warning' },
  { min: 5, text: 'LOCKED IN 🎯', color: 'text-primary' },
  { min: 7, text: 'UNSTOPPABLE 💪', color: 'text-destructive' },
  { min: 10, text: 'LEGENDARY ⚡', color: 'text-warning' },
];

const getStreakMessage = (streak: number) => {
  for (let i = STREAK_MESSAGES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_MESSAGES[i].min) return STREAK_MESSAGES[i];
  }
  return null;
};

export const StreakIndicator = ({ streak, show }: StreakIndicatorProps) => {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (show && streak >= 3) {
      setKey(prev => prev + 1);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [show, streak]);

  const message = getStreakMessage(streak);
  if (!visible || !message) return null;

  return (
    <div
      key={key}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="animate-score-pop flex flex-col items-center gap-1">
        {/* Streak counter */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full glass-strong",
          "border-2 border-warning/40"
        )}>
          <span className="text-2xl animate-streak-glow">🔥</span>
          <span className="font-bold text-lg text-warning">{streak}x</span>
        </div>
        
        {/* Streak message */}
        <div className={cn(
          "font-bold text-sm tracking-wide animate-fade-in",
          message.color
        )}>
          {message.text}
        </div>
      </div>
    </div>
  );
};
