import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmojiButtonProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiButton({ onEmojiSelect, className }: EmojiButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Smile className="w-5 h-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-12 left-0 z-50 animate-scale-in">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.AUTO}
            width={320}
            height={400}
            searchPlaceHolder="Search emoji..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
