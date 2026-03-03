import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';

interface Player {
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  tier?: string;
}

interface BattleVSScreenProps {
  player1: Player;
  player2: Player;
  onComplete: () => void;
}

export const BattleVSScreen = ({ player1, player2, onComplete }: BattleVSScreenProps) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showVS, setShowVS] = useState(false);

  useEffect(() => {
    // Phase 1: Avatars slide in (600ms)
    // Phase 2: VS appears (400ms after)
    const vsTimer = setTimeout(() => setShowVS(true), 600);
    // Phase 3: Countdown starts
    const countdownStart = setTimeout(() => setCountdown(3), 1200);
    
    return () => {
      clearTimeout(vsTimer);
      clearTimeout(countdownStart);
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setTimeout(onComplete, 400);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 700);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-destructive/10" />
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-destructive/5 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="relative flex items-center gap-6 md:gap-12">
        {/* Player 1 - slides from left */}
        <motion.div
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0px hsl(var(--primary))', '0 0 30px hsl(var(--primary) / 0.4)', '0 0 0px hsl(var(--primary))'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full"
          >
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-3 border-primary">
              <AvatarImage src={player1.avatar_url || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {(player1.username || 'P1')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="text-center">
            <p className="font-bold text-lg">{player1.display_name || player1.username || 'Player 1'}</p>
            {player1.tier && <TierBadge tier={player1.tier as any} size="sm" />}
          </div>
        </motion.div>

        {/* VS Badge */}
        <AnimatePresence>
          {showVS && countdown === null && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-destructive flex items-center justify-center shadow-lg shadow-primary/30">
                <Swords className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <span className="text-2xl font-black tracking-wider text-primary">VS</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        <AnimatePresence mode="wait">
          {countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute left-1/2 -translate-x-1/2"
            >
              <span className="text-6xl md:text-8xl font-black text-primary drop-shadow-lg">
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player 2 - slides from right */}
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0px hsl(var(--destructive))', '0 0 30px hsl(var(--destructive) / 0.4)', '0 0 0px hsl(var(--destructive))'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-full"
          >
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-3 border-destructive">
              <AvatarImage src={player2.avatar_url || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-destructive/10 text-destructive">
                {(player2.username || 'P2')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="text-center">
            <p className="font-bold text-lg">{player2.display_name || player2.username || 'Player 2'}</p>
            {player2.tier && <TierBadge tier={player2.tier as any} size="sm" />}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
