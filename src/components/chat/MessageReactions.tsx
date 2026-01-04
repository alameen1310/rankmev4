import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: string[];
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
  className?: string;
}

export function MessageReactions({ reactions, onToggleReaction, className }: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1", className)}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggleReaction(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
            reaction.hasReacted
              ? "bg-primary/20 border border-primary/40"
              : "bg-muted border border-transparent hover:border-border"
          )}
          title={reaction.users.join(', ')}
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
