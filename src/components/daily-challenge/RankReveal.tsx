import { useEffect, useState, useRef } from 'react';
import { Trophy, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankRevealProps {
  finalRank: number;
  totalParticipants: number;
  percentile: number;
  onComplete?: () => void;
}

/**
 * Animated rank reveal that counts down from a higher number to the final rank.
 * Creates tension and excitement as the rank "settles" into place.
 */
export function RankReveal({ finalRank, totalParticipants, percentile, onComplete }: RankRevealProps) {
  const [displayRank, setDisplayRank] = useState(0);
  const [phase, setPhase] = useState<'counting' | 'landed' | 'glow'>('counting');
  const frameRef = useRef<number>();

  useEffect(() => {
    // Start from a rank ~3x higher (or totalParticipants, whichever is smaller)
    const startRank = Math.min(Math.max(finalRank * 3, finalRank + 15), totalParticipants || finalRank + 20);
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out exponential - fast start, slow settle
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startRank - (startRank - finalRank) * eased);
      setDisplayRank(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayRank(finalRank);
        setPhase('landed');
        // Glow after landing
        setTimeout(() => {
          setPhase('glow');
          onComplete?.();
        }, 400);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [finalRank, totalParticipants, onComplete]);

  const isTopTen = percentile >= 90;
  const isTopThirty = percentile >= 70;

  return (
    <div className="flex flex-col items-center">
      {/* Rank Circle */}
      <div
        className={cn(
          "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
          phase === 'counting' && "scale-100",
          phase === 'landed' && "scale-110",
          phase === 'glow' && "scale-100",
          isTopTen
            ? "bg-gradient-to-br from-warning/30 to-warning/10 border-4 border-warning/60"
            : isTopThirty
            ? "bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/60"
            : "bg-gradient-to-br from-muted to-muted/50 border-4 border-border"
        )}
      >
        {/* Glow ring */}
        {phase === 'glow' && isTopTen && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-warning" />
        )}
        {phase === 'glow' && isTopThirty && !isTopTen && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-15 bg-primary" />
        )}

        <div className="text-center z-10">
          {isTopTen && phase === 'glow' && (
            <Crown className="w-5 h-5 text-warning mx-auto mb-0.5 animate-bounce" />
          )}
          <div className={cn(
            "text-4xl font-bold tabular-nums transition-all duration-300",
            phase === 'counting' && "text-muted-foreground",
            phase === 'landed' && (isTopTen ? "text-warning" : isTopThirty ? "text-primary" : "text-foreground"),
            phase === 'glow' && (isTopTen ? "text-warning" : isTopThirty ? "text-primary" : "text-foreground"),
          )}>
            #{displayRank}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            of {totalParticipants}
          </div>
        </div>
      </div>

      {/* Percentile badge */}
      <div className={cn(
        "mt-3 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-500",
        phase === 'glow' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        isTopTen
          ? "bg-warning/20 text-warning border border-warning/30"
          : isTopThirty
          ? "bg-primary/20 text-primary border border-primary/30"
          : "bg-muted text-muted-foreground border border-border"
      )}>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Top {Math.max(1, 100 - Math.round(percentile))}% of players
        </div>
      </div>
    </div>
  );
}
