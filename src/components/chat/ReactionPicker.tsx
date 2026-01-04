import { cn } from '@/lib/utils';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

export function ReactionPicker({ onSelect, onClose, className }: ReactionPickerProps) {
  return (
    <div 
      className={cn(
        "absolute flex items-center gap-1 p-2 bg-card border border-border rounded-full shadow-lg animate-scale-in z-50",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded-full transition-transform hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
