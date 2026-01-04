import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  status: 'sent' | 'delivered' | 'read';
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
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
