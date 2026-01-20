"use client";

import { useEffect, useRef, useState } from "react";

interface UsePlayOnceOnVisibleOptions {
  /**
   * Threshold for visibility (0-1). Default is 0.5 (50%).
   */
  threshold?: number;
  /**
   * Root margin for the intersection observer. Default is "0px".
   */
  rootMargin?: string;
  /**
   * Whether to respect prefers-reduced-motion. Default is true.
   */
  respectReducedMotion?: boolean;
}

/**
 * Hook that triggers a callback once when an element becomes visible.
 * Uses IntersectionObserver for efficient visibility detection.
 * Respects prefers-reduced-motion accessibility setting.
 *
 * @param callback - Function to call when element becomes visible
 * @param options - Configuration options
 * @returns A ref to attach to the element and a boolean indicating if it should play
 */
export function usePlayOnceOnVisible<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  options: UsePlayOnceOnVisibleOptions = {},
): [React.RefObject<T>, boolean] {
  const {
    threshold = 0.5,
    rootMargin = "0px",
    respectReducedMotion = true,
  } = options;

  const elementRef = useRef<T>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const hasTriggeredRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    if (respectReducedMotion && typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReducedMotion) {
        // Immediately trigger callback and set shouldPlay to true for final state
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          setShouldPlay(true);
          callback();
        }
        return;
      }
    }

    // If already triggered, don't set up observer
    if (hasTriggeredRef.current) {
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= threshold &&
          !hasTriggeredRef.current
        ) {
          hasTriggeredRef.current = true;
          setShouldPlay(true);
          callback();

          // Disconnect observer after triggering
          if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [callback, threshold, rootMargin, respectReducedMotion]);

  return [elementRef, shouldPlay];
}
