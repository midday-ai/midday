import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
  disabled?: boolean;
}

interface UseLongPressHandlers {
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseUp: (event: React.MouseEvent) => void;
  onMouseLeave: (event: React.MouseEvent) => void;
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  disabled = false,
}: UseLongPressOptions): UseLongPressHandlers {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const isClickRef = useRef(false);

  const start = useCallback(() => {
    if (disabled) return;

    isClickRef.current = true;
    isLongPressRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      isClickRef.current = false;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold, disabled]);

  const clear = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    clear();

    // If it was a quick click (not a long press) and onClick is provided
    if (isClickRef.current && !isLongPressRef.current && onClick && !disabled) {
      onClick();
    }

    isClickRef.current = false;
    isLongPressRef.current = false;
  }, [clear, onClick, disabled]);

  const cancel = useCallback(() => {
    clear();
    isClickRef.current = false;
    isLongPressRef.current = false;
  }, [clear]);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
  };
}
