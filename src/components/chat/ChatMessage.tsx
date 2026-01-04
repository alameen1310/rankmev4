import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageStatus } from './MessageStatus';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';
import { useLongPress } from '@/hooks/useLongPress';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: string[];
}

interface ChatMessageProps {
  id: string;
  message: string;
  messageType?: 'text' | 'gif' | 'image';
  gifUrl?: string;
  isOwn: boolean;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  reactions: Reaction[];
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
}

export function ChatMessage({
  id,
  message,
  messageType = 'text',
  gifUrl,
  isOwn,
  timestamp,
  status,
  reactions,
  onAddReaction,
  onRemoveReaction,
}: ChatMessageProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const { isPressed, handlers } = useLongPress({
    threshold: 500,
    onLongPress: () => setShowReactionPicker(true),
  });

  const handleToggleReaction = (emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    if (reaction?.hasReacted) {
      onRemoveReaction(id, emoji);
    } else {
      onAddReaction(id, emoji);
    }
  };

  const handleSelectReaction = (emoji: string) => {
    onAddReaction(id, emoji);
    setShowReactionPicker(false);
  };

  return (
    <div
      className={cn(
        "relative flex",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Reaction Picker */}
      {showReactionPicker && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowReactionPicker(false)} 
          />
          <ReactionPicker
            onSelect={handleSelectReaction}
            onClose={() => setShowReactionPicker(false)}
            className={cn(
              "bottom-full mb-2",
              isOwn ? "right-0" : "left-0"
            )}
          />
        </>
      )}

      <div
        {...handlers}
        className={cn(
          "max-w-[75%] rounded-2xl transition-transform select-none",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md",
          isPressed && "scale-95 opacity-80"
        )}
      >
        {/* GIF Content */}
        {messageType === 'gif' && gifUrl ? (
          <div className="p-1 overflow-hidden rounded-2xl">
            <img
              src={gifUrl}
              alt="GIF"
              className="rounded-xl max-w-full"
              loading="lazy"
            />
          </div>
        ) : (
          /* Text Content */
          <div className="px-4 py-2">
            <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
          </div>
        )}

        {/* Timestamp and Status */}
        <div className={cn(
          "flex items-center gap-1 px-4 pb-2",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && status && (
            <MessageStatus 
              status={status} 
              className={isOwn ? "text-primary-foreground" : "text-muted-foreground"} 
            />
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="px-2 pb-2">
            <MessageReactions
              reactions={reactions}
              onToggleReaction={handleToggleReaction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
