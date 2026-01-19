import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { MediaMessage, MediaViewer } from './MediaViewer';
import { ReplyIndicator } from './ReplyPreview';
import { SwipeableMessage } from './SwipeableMessage';
import { useLongPress } from '@/hooks/useLongPress';
import type { MessageType, MessageStatus } from '@/services/chat';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: string[];
}

interface ChatMessageProps {
  id: string;
  message: string;
  messageType?: MessageType;
  gifUrl?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  isOwn: boolean;
  timestamp: string;
  status?: MessageStatus;
  reactions: Reaction[];
  senderName?: string;
  isAdminMessage?: boolean;
  replyTo?: {
    message: string;
    messageType: MessageType;
    senderName: string;
  };
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
}

// Check if message is from admin (prefixed with [RankMe Admin])
const isAdminMessageContent = (message: string): boolean => {
  return message.startsWith('[RankMe Admin]');
};

// Extract clean message content (remove admin prefix)
const getCleanMessage = (message: string): string => {
  if (message.startsWith('[RankMe Admin]')) {
    return message.replace('[RankMe Admin]', '').trim();
  }
  return message;
};

export function ChatMessage({
  id,
  message,
  messageType = 'text',
  gifUrl,
  mediaUrl,
  thumbnailUrl,
  duration,
  width,
  height,
  isOwn,
  timestamp,
  status,
  reactions,
  senderName,
  isAdminMessage: isAdminProp,
  onAddReaction,
  onRemoveReaction,
}: ChatMessageProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);

  // Determine if this is an admin message (either passed as prop or detected from content)
  const isAdminMessage = isAdminProp || isAdminMessageContent(message);
  const displayMessage = getCleanMessage(message);

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

  const renderContent = () => {
    switch (messageType) {
      case 'gif':
        return gifUrl ? (
          <div className="p-1 overflow-hidden rounded-2xl">
            <img
              src={gifUrl}
              alt="GIF"
              className="rounded-xl max-w-full"
              loading="lazy"
            />
          </div>
        ) : null;

      case 'image':
        return mediaUrl ? (
          <div className="p-1 overflow-hidden">
            <MediaMessage
              type="image"
              url={mediaUrl}
              width={width}
              height={height}
              isOwn={isOwn}
              onClick={() => setShowMediaViewer(true)}
            />
          </div>
        ) : null;

      case 'video':
        return mediaUrl ? (
          <div className="p-1 overflow-hidden">
            <MediaMessage
              type="video"
              url={mediaUrl}
              thumbnailUrl={thumbnailUrl}
              width={width}
              height={height}
              duration={duration}
              isOwn={isOwn}
              onClick={() => setShowMediaViewer(true)}
            />
          </div>
        ) : null;

      case 'audio':
        return mediaUrl ? (
          <VoiceNotePlayer
            url={mediaUrl}
            duration={duration}
            isOwn={isOwn}
          />
        ) : null;

      default:
        return (
          <div className="px-4 py-2">
            {/* Admin badge & sender name */}
            {isAdminMessage && !isOwn && (
              <div className="flex items-center gap-1.5 mb-1">
                <span 
                  className="text-xs font-bold tracking-wide uppercase"
                  style={{ 
                    color: '#FFD700',
                    textShadow: '0 0 4px rgba(255,215,0,0.5)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '0.05em'
                  }}
                >
                  🛡️ RANKME ADMIN
                </span>
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap break-words">{displayMessage}</p>
          </div>
        );
    }
  };

  return (
    <>
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
              : isAdminMessage
                ? "bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 rounded-bl-md"
                : "bg-muted rounded-bl-md",
            isPressed && "scale-95 opacity-80"
          )}
        >
          {renderContent()}

          {/* Timestamp and Status - Only show for non-media or below media */}
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
              <MessageStatusIndicator 
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

      {/* Full screen media viewer */}
      {showMediaViewer && mediaUrl && (messageType === 'image' || messageType === 'video') && (
        <MediaViewer
          type={messageType}
          url={mediaUrl}
          thumbnailUrl={thumbnailUrl}
          onClose={() => setShowMediaViewer(false)}
        />
      )}
    </>
  );
}
