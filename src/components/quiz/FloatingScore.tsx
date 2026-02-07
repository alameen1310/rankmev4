import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FloatingScoreProps {
  points: number;
  speedBonus?: number;
  comboText?: string;
  isVisible: boolean;
}

export const FloatingScore = ({ points, speedBonus, comboText, isVisible }: FloatingScoreProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 900);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center gap-0.5">
      {/* Main points */}
      <div className="animate-float-up-fade text-primary font-bold text-lg whitespace-nowrap">
        +{points} XP
      </div>

      {/* Speed bonus */}
      {speedBonus && speedBonus > 0 && (
        <div
          className="animate-float-up-fade text-xs font-semibold whitespace-nowrap"
          style={{
            color: 'hsl(280 100% 70%)',
            animationDelay: '0.1s',
          }}
        >
          ⚡ FAST! +{speedBonus}
        </div>
      )}

      {/* Combo text */}
      {comboText && (
        <div
          className="animate-float-up-fade text-xs font-bold whitespace-nowrap text-warning"
          style={{ animationDelay: '0.15s' }}
        >
          {comboText}
        </div>
      )}
    </div>
  );
};
