import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GifPicker } from './GifPicker';
import { cn } from '@/lib/utils';

interface Gif {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

interface GifButtonProps {
  onGifSelect: (gif: Gif) => void;
  className?: string;
}

export function GifButton({ onGifSelect, className }: GifButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <span className="text-xs font-bold">GIF</span>
      </Button>
      
      {isOpen && (
        <GifPicker
          onSelect={(gif) => {
            onGifSelect(gif);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
