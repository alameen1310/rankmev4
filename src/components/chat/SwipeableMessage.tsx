import { useState, useRef, ReactNode } from 'react';
import { Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableMessageProps {
  children: ReactNode;
  onSwipeReply: () => void;
  isOwn: boolean;
  disabled?: boolean;
}

export function SwipeableMessage({ 
  children, 
  onSwipeReply, 
  isOwn,
  disabled = false 
}: SwipeableMessageProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const threshold = 60; // Pixels needed to trigger reply
  const maxOffset = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    // Determine if this is a horizontal or vertical swipe
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // Only handle horizontal swipes
    if (!isHorizontalSwipe.current) return;

    // For own messages: swipe left (negative delta)
    // For other messages: swipe right (positive delta)
    const validSwipe = isOwn ? deltaX < 0 : deltaX > 0;
    
    if (validSwipe) {
      e.preventDefault();
      const absOffset = Math.min(Math.abs(deltaX), maxOffset);
      setOffset(isOwn ? -absOffset : absOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Check if swipe exceeded threshold
    if (Math.abs(offset) >= threshold) {
      onSwipeReply();
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
    
    // Reset position with animation
    setOffset(0);
    isHorizontalSwipe.current = null;
  };

  const progress = Math.min(Math.abs(offset) / threshold, 1);

  return (
    <div className="relative overflow-visible">
      {/* Reply indicator */}
      <div 
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity",
          isOwn ? "left-0 -translate-x-full pl-2" : "right-0 translate-x-full pr-2",
          progress > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          opacity: progress,
          transform: `translateY(-50%) scale(${0.5 + progress * 0.5})`,
        }}
      >
        <div 
          className={cn(
            "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-colors",
            progress >= 1 && "bg-primary/20"
          )}
        >
          <Reply className={cn(
            "w-4 h-4 text-primary transition-transform",
            progress >= 1 && "scale-110"
          )} />
        </div>
      </div>

      {/* Message content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative transition-transform touch-pan-y",
          !isDragging && "duration-200"
        )}
        style={{ 
          transform: `translateX(${offset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
