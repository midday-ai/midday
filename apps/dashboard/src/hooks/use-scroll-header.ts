"use client";

import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";

/**
 * CSS variable name for header offset (0 when visible, header height when hidden)
 */
export const HEADER_OFFSET_VAR = "--header-offset";

/**
 * CSS variable name for header transition duration
 */
export const HEADER_TRANSITION_VAR = "--header-transition";

/**
 * Base header height in pixels
 */
const HEADER_HEIGHT = 70;

interface UseScrollHeaderOptions {
  /**
   * Extra offset to add when hiding (e.g., for summary grids)
   * This is added to the base header height (70px)
   */
  extraOffset?: number;
}

/**
 * Hook to manage header visibility based on scroll position.
 * Uses CSS custom properties for performant updates without React re-renders.
 *
 * Sets CSS variable on document.documentElement:
 * - --header-offset: "0px" when at top, calculated offset when scrolled
 *
 * @param scrollRef - Optional ref to a scroll container. If not provided, uses window scroll.
 * @param options - Configuration options including extra offset for summary grids
 */
export function useScrollHeader(
  scrollRef?: RefObject<HTMLElement | null>,
  options?: UseScrollHeaderOptions,
) {
  const { extraOffset = 0 } = options ?? {};
  const prevHiddenRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const hasScrolledRef = useRef<boolean>(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>(pathname);

  // Reset header when navigating to a different page (not just tab changes)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      prevHiddenRef.current = false;
      hasScrolledRef.current = false;
      document.documentElement.style.setProperty(HEADER_OFFSET_VAR, "0px");
      document.body.style.overflow = "";
    }
  }, [pathname]);

  useEffect(() => {
    // Don't restore transition on mount - let first scroll enable it
    // This ensures navigation resets are instant (no animation)

    const handleScroll = () => {
      // Cancel any pending RAF to avoid stacking
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        // Enable transition after first scroll (keeps navigation instant)
        if (!hasScrolledRef.current) {
          hasScrolledRef.current = true;
          document.documentElement.style.setProperty(
            HEADER_TRANSITION_VAR,
            "200ms",
          );
        }

        let scrollTop: number;

        if (scrollRef?.current) {
          scrollTop = scrollRef.current.scrollTop;
        } else {
          scrollTop = window.scrollY || document.documentElement.scrollTop;
        }

        const shouldHide = scrollTop > 0;

        // Only update if state changed
        if (shouldHide !== prevHiddenRef.current) {
          prevHiddenRef.current = shouldHide;
          // Calculate total offset: base header height + any extra offset (summary grid)
          const totalOffset = HEADER_HEIGHT + extraOffset;
          // Update CSS variables - this is very performant as it only touches the DOM once
          // and all CSS calculations using var(--header-offset) update automatically
          document.documentElement.style.setProperty(
            HEADER_OFFSET_VAR,
            shouldHide ? `${totalOffset}px` : "0px",
          );
          // Set overflow on body to prevent body scroll when header is collapsed
          document.body.style.overflow = shouldHide ? "hidden" : "";
        }

        rafRef.current = null;
      });
    };

    const scrollElement = scrollRef?.current ?? window;

    // Use passive listener for better scroll performance
    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);

      // Cancel any pending RAF on cleanup
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // Reset state for next mount
      hasScrolledRef.current = false;

      // Reset CSS variable on cleanup - each page manages its own state
      // Disable transition to prevent animation during navigation
      document.documentElement.style.setProperty(HEADER_TRANSITION_VAR, "0s");
      document.documentElement.style.setProperty(HEADER_OFFSET_VAR, "0px");
      document.body.style.overflow = "";
    };
  }, [scrollRef, extraOffset]);
}
