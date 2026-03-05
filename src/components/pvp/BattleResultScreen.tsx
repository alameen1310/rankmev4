import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Swords, TrendingUp, TrendingDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/Confetti';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  score?: number | null;
  correct_answers?: number | null;
  answers_correct?: number | null;
}

interface BattleResultScreenProps {
  participants: Participant[];
  winnerId: string | null;
  currentUserId: string;
  totalQuestions: number;
  battleId: string;
  matchType: 'casual' | 'ranked';
  onNewBattle: () => void;
  onLeaderboard: () => void;
}

const useCountUp = (target: number, duration: number, delay: number) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        setValue(Math.floor(progress * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      tick();
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
};

export const BattleResultScreen = ({
  participants,
  winnerId,
  currentUserId,
  totalQuestions,
  battleId,
  matchType,
  onNewBattle,
  onLeaderboard,
}: BattleResultScreenProps) => {
  const [phase, setPhase] = useState(0);
  const [rankDelta, setRankDelta] = useState<number | null>(null);
  const isWinner = winnerId === currentUserId;

  const me = participants.find(p => p.user_id === currentUserId);
  const opponent = participants.find(p => p.user_id !== currentUserId);

  const myScore = useCountUp(me?.score || 0, 800, 400);
  const opponentScore = useCountUp(opponent?.score || 0, 800, 400);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (matchType !== 'ranked') return;

    const loadRankDelta = async () => {
      const { data } = await supabase
        .from('battle_rank_changes')
        .select('delta')
        .eq('battle_id', battleId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (data) {
        setRankDelta(data.delta);
      }
    };

    loadRankDelta();
  }, [battleId, currentUserId, matchType]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24 relative">
      {isWinner && phase >= 2 && <Confetti isActive={true} />}

      <div className="max-w-lg mx-auto p-4 pt-12 space-y-6">
        {phase >= 1 && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="flex justify-center"
          >
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center",
              isWinner
                ? "bg-gradient-to-br from-warning/20 to-warning/10 shadow-lg shadow-warning/20"
                : "bg-muted"
            )}>
              {isWinner ? (
                <Crown className="w-12 h-12 text-warning" />
              ) : (
                <Swords className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </motion.div>
        )}

        {phase >= 2 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <h1 className={cn(
              "text-4xl font-black",
              isWinner ? "text-warning" : "text-muted-foreground"
            )}>
              {isWinner ? 'VICTORY!' : 'DEFEAT'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isWinner ? 'You crushed it!' : 'Better luck next time!'}
            </p>
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className={cn(
              "p-5 rounded-2xl text-center relative overflow-hidden",
              me?.user_id === winnerId
                ? "bg-gradient-to-b from-warning/10 to-warning/5 border-2 border-warning/40"
                : "bg-muted/50 border border-border"
            )}>
              <Avatar className="w-14 h-14 mx-auto mb-2 relative z-10">
                <AvatarImage src={me?.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {(me?.username || 'Y')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold truncate relative z-10">You</p>
              <p className="text-3xl font-black text-primary mt-1 relative z-10">{myScore}</p>
              <p className="text-xs text-muted-foreground relative z-10">
                {me?.correct_answers ?? me?.answers_correct ?? 0}/{totalQuestions} correct
              </p>
            </div>

            <div className={cn(
              "p-5 rounded-2xl text-center relative overflow-hidden",
              opponent?.user_id === winnerId
                ? "bg-gradient-to-b from-warning/10 to-warning/5 border-2 border-warning/40"
                : "bg-muted/50 border border-border"
            )}>
              <Avatar className="w-14 h-14 mx-auto mb-2">
                <AvatarImage src={opponent?.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {(opponent?.username || 'O')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold truncate">{opponent?.display_name || opponent?.username || 'Opponent'}</p>
              <p className="text-3xl font-black text-primary mt-1">{opponentScore}</p>
              <p className="text-xs text-muted-foreground">
                {opponent?.correct_answers ?? opponent?.answers_correct ?? 0}/{totalQuestions} correct
              </p>
            </div>
          </motion.div>
        )}

        {phase >= 4 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-4 rounded-xl mx-auto w-fit",
              matchType === 'ranked'
                ? (rankDelta || 0) >= 0
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            {matchType === 'ranked' ? (
              (rankDelta || 0) >= 0 ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold">+{Math.abs(rankDelta || 0)} Rank Points</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-bold">-{Math.abs(rankDelta || 0)} Rank Points</span>
                </>
              )
            ) : (
              <span className="font-bold">Casual Match • No Rank Change</span>
            )}
          </motion.div>
        )}

        {phase >= 5 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex gap-3"
          >
            <Button variant="hero" className="flex-1" onClick={onNewBattle}>
              New Battle
            </Button>
            <Button variant="outline" className="flex-1" onClick={onLeaderboard}>
              Leaderboard
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
