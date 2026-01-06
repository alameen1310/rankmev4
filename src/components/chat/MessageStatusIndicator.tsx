import { Check, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusIndicatorProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  className?: string;
}

export function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {status === 'sending' && (
        <Loader2 className="w-3 h-3 animate-spin opacity-50" />
      )}
      {status === 'sent' && (
        <Check className="w-3 h-3 opacity-70" />
      )}
      {status === 'delivered' && (
        <CheckCheck className="w-3 h-3 opacity-70" />
      )}
      {status === 'read' && (
        <CheckCheck className="w-3 h-3 text-sky-400" />
      )}
    </span>
  );
}
