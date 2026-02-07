import { useRef, useState } from 'react';
import { Share2, Download, Trophy, Target, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SubmitResponse } from '@/services/dailyChallenge';

interface ShareRankCardProps {
  result: SubmitResponse;
  visible: boolean;
}

/**
 * Animated shareable rank card with stats for Daily Challenge results.
 * Pulses the share button once to draw attention.
 */
export function ShareRankCard({ result, visible }: ShareRankCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    setSharing(true);
    
    const shareText = [
      `🏆 Daily Challenge Results`,
      ``,
      `📊 Rank: #${result.rank}`,
      `⚡ Score: ${result.attempt.score}`,
      `🎯 Accuracy: ${Math.round(result.attempt.accuracy)}%`,
      `⏱️ Time: ${formatTime(result.attempt.time_taken_seconds)}`,
      ``,
      `Top ${Math.max(1, 100 - Math.round(result.percentile))}% of players!`,
      ``,
      `Can you beat my score? 💪`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Daily Challenge Results',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        // Toast will be handled by parent
      }
    } catch (err) {
      // User cancelled share or error
      console.log('Share cancelled');
    } finally {
      setSharing(false);
    }
  };

  const isTopTen = result.percentile >= 90;
  const isTopThirty = result.percentile >= 70;

  return (
    <div className={cn(
      "w-full transition-all duration-500",
      visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
    )}>
      {/* The Card */}
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-2xl p-5 border-2",
          isTopTen
            ? "bg-gradient-to-br from-warning/15 via-card to-warning/5 border-warning/40"
            : isTopThirty
            ? "bg-gradient-to-br from-primary/15 via-card to-primary/5 border-primary/40"
            : "bg-gradient-to-br from-muted/50 via-card to-muted/30 border-border"
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-warning/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-primary/10 blur-2xl" />

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isTopTen ? "bg-warning/20" : "bg-primary/20"
          )}>
            <Trophy className={cn("w-5 h-5", isTopTen ? "text-warning" : "text-primary")} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Daily Challenge</h3>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className={cn(
              "text-2xl font-bold tabular-nums",
              isTopTen ? "text-warning" : isTopThirty ? "text-primary" : "text-foreground"
            )}>
              #{result.rank}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="relative grid grid-cols-3 gap-2">
          <div className="glass rounded-lg p-2.5 text-center">
            <Zap className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold tabular-nums">{result.attempt.score}</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>
          <div className="glass rounded-lg p-2.5 text-center">
            <Target className="w-3.5 h-3.5 text-success mx-auto mb-1" />
            <p className="text-sm font-bold tabular-nums">{Math.round(result.attempt.accuracy)}%</p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </div>
          <div className="glass rounded-lg p-2.5 text-center">
            <Clock className="w-3.5 h-3.5 text-warning mx-auto mb-1" />
            <p className="text-sm font-bold tabular-nums">{formatTime(result.attempt.time_taken_seconds)}</p>
            <p className="text-[10px] text-muted-foreground">Time</p>
          </div>
        </div>

        {/* Percentile bar */}
        <div className="relative mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Your position</span>
            <span className="font-medium">
              Top {Math.max(1, 100 - Math.round(result.percentile))}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                isTopTen
                  ? "bg-gradient-to-r from-warning to-warning/70"
                  : isTopThirty
                  ? "bg-gradient-to-r from-primary to-primary/70"
                  : "bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30"
              )}
              style={{ width: `${Math.min(result.percentile, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Share Button */}
      <Button
        onClick={handleShare}
        disabled={sharing}
        className={cn(
          "w-full mt-3 h-11 font-semibold gap-2",
          visible && "animate-[pulse_1.5s_ease-in-out_1]"
        )}
      >
        <Share2 className="w-4 h-4" />
        Share Your Rank
      </Button>
    </div>
  );
}
