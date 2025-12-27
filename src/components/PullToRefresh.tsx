import { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance
      const resistance = Math.min(diff * 0.5, 120);
      setPullDistance(resistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const showIndicator = pullDistance > 20 || isRefreshing;
  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex justify-center transition-all duration-200 z-10",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: isRefreshing ? 16 : pullDistance - 40,
          transform: `scale(${progress})`,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-card shadow-md flex items-center justify-center",
          isRefreshing && "animate-bounce-subtle"
        )}>
          <Loader2 
            className={cn(
              "h-5 w-5 text-primary",
              isRefreshing ? "animate-spin" : ""
            )} 
            style={{ 
              transform: !isRefreshing ? `rotate(${progress * 180}deg)` : undefined 
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{ 
          transform: isRefreshing 
            ? 'translateY(60px)' 
            : `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};