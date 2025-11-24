"use client";

import { useEffect, useRef, useState } from "react";

export interface UseScrollDirectionOptions {
  /**
   * Minimum scroll distance in pixels to trigger direction change
   * @default 5
   */
  threshold?: number;
  /**
   * Throttle delay in milliseconds for scroll events
   * @default 100
   */
  throttle?: number;
  /**
   * Whether to show suggestions when at bottom regardless of scroll direction
   * @default true
   */
  showAtBottom?: boolean;
}

export type ScrollDirection = "up" | "down" | null;

export interface UseScrollDirectionReturn {
  /**
   * Current scroll direction: 'up', 'down', or null
   */
  direction: ScrollDirection;
  /**
   * Whether the user is at the bottom of the scroll container
   */
  isAtBottom: boolean;
  /**
   * Whether suggestions should be visible based on scroll direction and position
   */
  shouldShow: boolean;
}

/**
 * Hook to detect scroll direction in a scrollable container
 * @param containerRef - Ref to the scrollable container element
 * @param options - Configuration options
 * @returns Scroll direction state and visibility flag
 */
export function useScrollDirection(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseScrollDirectionOptions = {},
  trigger?: number,
): UseScrollDirectionReturn {
  const { threshold = 5, throttle = 100, showAtBottom = true } = options;

  const [direction, setDirection] = useState<ScrollDirection>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollTopRef = useRef<number>(0);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const containerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    // If container changed, reset initial mount
    if (container !== containerElementRef.current) {
      isInitialMountRef.current = true;
      containerElementRef.current = container;
    }

    if (!container) {
      // Reset state when container is not available
      setDirection(null);
      setIsAtBottom(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight;

      // Check if at bottom (with small threshold for rounding)
      const atBottom = currentScrollTop >= maxScrollTop - 10;
      setIsAtBottom(atBottom);

      // Skip initial mount to avoid false positives
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        lastScrollTopRef.current = currentScrollTop;
        setDirection(atBottom ? null : "up");
        return;
      }

      // Calculate scroll delta
      const scrollDelta = currentScrollTop - lastScrollTopRef.current;

      // Update direction if scroll delta exceeds threshold
      if (Math.abs(scrollDelta) >= threshold) {
        const newDirection: ScrollDirection =
          scrollDelta > 0 ? "down" : scrollDelta < 0 ? "up" : null;
        setDirection(newDirection);
      }

      // Always update lastScrollTop to track cumulative movement
      lastScrollTopRef.current = currentScrollTop;
    };

    // Direct scroll handler (no throttle for testing)
    const handleScrollDirect = () => {
      handleScroll();
    };

    // Throttled scroll handler
    const throttledHandleScroll = () => {
      if (throttleTimeoutRef.current) {
        return;
      }

      throttleTimeoutRef.current = setTimeout(() => {
        handleScroll();
        throttleTimeoutRef.current = null;
      }, throttle);
    };

    // Listen to scroll events
    container.addEventListener("scroll", handleScrollDirect, {
      passive: true,
    });

    // Also listen to wheel events as fallback (for touchpad/mouse wheel)
    const handleWheel = (e: WheelEvent) => {
      // Only handle vertical scrolling
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        handleScrollDirect();
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: true });

    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScrollDirect);
      container.removeEventListener("wheel", handleWheel);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [containerRef, threshold, throttle, trigger]);

  // Determine if suggestions should be visible
  // Priority: scrolling up always hides, then check if at bottom or scrolling down
  const shouldShow =
    direction === "up"
      ? false // Always hide when scrolling up
      : direction === "down"
        ? true // Always show when scrolling down
        : showAtBottom && isAtBottom // Show when at bottom (if enabled) and not scrolling
          ? true
          : direction === null; // Show on initial mount

  return {
    direction,
    isAtBottom,
    shouldShow,
  };
}
