import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Player {
  user_id: string;
  username?: string | null;
  avatar_url?: string | null;
  score?: number | null;
}

interface BattleScoreTickerProps {
  player1: Player;
  player2: Player;
  currentUserId: string;
}

export const BattleScoreTicker = ({ player1, player2, currentUserId }: BattleScoreTickerProps) => {
  const total = Math.max((player1.score || 0) + (player2.score || 0), 1);
  const p1Pct = ((player1.score || 0) / total) * 100;

  const isP1Me = player1.user_id === currentUserId;

  return (
    <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-2xl p-3 border border-border/50 shadow-sm">
      {/* Player 1 */}
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={player1.avatar_url || undefined} />
          <AvatarFallback className="text-xs font-bold">
            {(player1.username || '?')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <motion.span
          key={player1.score}
          initial={{ scale: 1.3, color: 'hsl(var(--primary))' }}
          animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
          transition={{ duration: 0.3 }}
          className="font-black text-lg tabular-nums"
        >
          {player1.score || 0}
        </motion.span>
      </div>

      {/* Score bar */}
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            isP1Me ? "bg-primary" : "bg-destructive"
          )}
          animate={{ width: `${p1Pct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
        <motion.div
          className={cn(
            "absolute inset-y-0 right-0 rounded-full",
            !isP1Me ? "bg-primary" : "bg-destructive"
          )}
          animate={{ width: `${100 - p1Pct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>

      {/* Player 2 */}
      <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={player2.avatar_url || undefined} />
          <AvatarFallback className="text-xs font-bold">
            {(player2.username || '?')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <motion.span
          key={player2.score}
          initial={{ scale: 1.3, color: 'hsl(var(--primary))' }}
          animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
          transition={{ duration: 0.3 }}
          className="font-black text-lg tabular-nums"
        >
          {player2.score || 0}
        </motion.span>
      </div>
    </div>
  );
};
