import { X, Reply, Mic, Image, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageType } from '@/services/chat';

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    message: string;
    messageType: MessageType;
    senderName: string;
    isOwn: boolean;
  };
  onCancel: () => void;
}

export function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
  const getMessagePreview = () => {
    switch (replyTo.messageType) {
      case 'audio':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Mic className="w-3 h-3" /> Voice message
          </span>
        );
      case 'image':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Image className="w-3 h-3" /> Photo
          </span>
        );
      case 'video':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Video className="w-3 h-3" /> Video
          </span>
        );
      case 'gif':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <FileText className="w-3 h-3" /> GIF
          </span>
        );
      default:
        return (
          <span className="text-muted-foreground line-clamp-1 text-sm">
            {replyTo.message}
          </span>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-l-2 border-primary rounded-t-lg">
      <Reply className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          {replyTo.isOwn ? 'You' : replyTo.senderName}
        </p>
        {getMessagePreview()}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onCancel}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Inline reply indicator shown on messages
export function ReplyIndicator({ 
  replyTo, 
  isOwn 
}: { 
  replyTo: { 
    message: string; 
    messageType: MessageType;
    senderName: string; 
  }; 
  isOwn: boolean;
}) {
  const getPreview = () => {
    switch (replyTo.messageType) {
      case 'audio': return '🎤 Voice message';
      case 'image': return '📷 Photo';
      case 'video': return '🎬 Video';
      case 'gif': return 'GIF';
      default: return replyTo.message;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-1.5 px-3 pt-2 pb-1 text-xs border-l-2",
        isOwn 
          ? "border-primary-foreground/50" 
          : "border-primary/50"
      )}
    >
      <Reply className={cn(
        "w-3 h-3 mt-0.5 shrink-0",
        isOwn ? "text-primary-foreground/70" : "text-primary/70"
      )} />
      <div className="min-w-0">
        <p className={cn(
          "font-medium",
          isOwn ? "text-primary-foreground/80" : "text-primary/80"
        )}>
          {replyTo.senderName}
        </p>
        <p className={cn(
          "line-clamp-1",
          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
        )}>
          {getPreview()}
        </p>
      </div>
    </div>
  );
}
