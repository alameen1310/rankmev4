import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
  threshold?: number;
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  onClick?: () => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onClick,
}: LongPressOptions) {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      // Get initial position
      if ('touches' in event) {
        startPosRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else {
        startPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
      }

      isLongPressRef.current = false;
      setIsPressed(true);

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress(event);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const end = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      setIsPressed(false);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // If it wasn't a long press, trigger onClick
      if (!isLongPressRef.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  const move = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (!startPosRef.current) return;

      // Get current position
      let currentX: number, currentY: number;
      if ('touches' in event) {
        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;
      } else {
        currentX = event.clientX;
        currentY = event.clientY;
      }

      // Cancel if moved more than 10px
      const dx = Math.abs(currentX - startPosRef.current.x);
      const dy = Math.abs(currentY - startPosRef.current.y);

      if (dx > 10 || dy > 10) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsPressed(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressed(false);
  }, []);

  return {
    isPressed,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: cancel,
      onMouseMove: move,
      onTouchStart: start,
      onTouchEnd: end,
      onTouchMove: move,
      onTouchCancel: cancel,
    },
  };
}
