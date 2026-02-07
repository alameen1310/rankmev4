import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Home, Zap, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/Confetti';
import { RankReveal } from '@/components/daily-challenge/RankReveal';
import { ShareRankCard } from '@/components/daily-challenge/ShareRankCard';
import type { SubmitResponse } from '@/services/dailyChallenge';

interface DailyChallengeResultProps {
  result: SubmitResponse;
}

/**
 * Phased result screen for Daily Challenge with:
 * 1. Rank counting animation
 * 2. Score & stats reveal
 * 3. Confetti for top 10%
 * 4. Animated share rank card
 * 5. CTA buttons
 */
export function DailyChallengeResult({ result }: DailyChallengeResultProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const isTopTen = result.percentile >= 90;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),    // Rank reveal starts
      setTimeout(() => setPhase(2), 1600),   // Score & message
      setTimeout(() => setPhase(3), 2200),   // Stats grid
      setTimeout(() => setPhase(4), 2800),   // Share card
      setTimeout(() => setPhase(5), 3400),   // CTA buttons
    ];

    // Confetti for top 10% — fire after rank lands
    if (isTopTen) {
      timers.push(setTimeout(() => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }, 1500));
    }

    return () => timers.forEach(clearTimeout);
  }, [isTopTen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen">
      <Confetti isActive={showConfetti} particleCount={70} duration={4000} />

      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="font-semibold text-center">Challenge Complete!</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">

        {/* Phase 1: Rank Reveal (counting animation) */}
        <div className={cn(
          "mb-4 transition-all duration-500",
          phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <RankReveal
            finalRank={result.rank}
            totalParticipants={result.totalParticipants}
            percentile={result.percentile}
          />
        </div>

        {/* Phase 2: Score + Message */}
        <div className={cn(
          "text-center mb-5 transition-all duration-500",
          phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="text-3xl font-bold text-primary tabular-nums mb-1">
            {result.attempt.score} pts
          </div>
          <p className="text-sm text-success font-medium">
            {result.message}
          </p>
        </div>

        {/* Phase 3: Stats Grid */}
        <div className={cn(
          "w-full max-w-xs mb-5 transition-all duration-500",
          phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: Zap, color: 'text-primary', value: `${result.attempt.correct_answers}/${result.attempt.total_questions}`, label: 'Correct', delay: 0 },
              { icon: Target, color: 'text-success', value: `${Math.round(result.attempt.accuracy)}%`, label: 'Accuracy', delay: 100 },
              { icon: Clock, color: 'text-warning', value: formatTime(result.attempt.time_taken_seconds), label: 'Time', delay: 200 },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "glass rounded-xl p-3 text-center transition-all duration-400",
                  phase >= 3 ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
                style={{ transitionDelay: phase >= 3 ? `${stat.delay}ms` : '0ms' }}
              >
                <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
                <div className="text-base font-bold tabular-nums">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 4: Share Rank Card */}
        <div className="w-full max-w-xs mb-5">
          <ShareRankCard result={result} visible={phase >= 4} />
        </div>

        {/* Phase 5: CTA Buttons */}
        <div className={cn(
          "flex gap-3 w-full max-w-xs transition-all duration-400",
          phase >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            className="flex-1 h-11"
            onClick={() => navigate('/daily-challenge/leaderboard')}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
}
