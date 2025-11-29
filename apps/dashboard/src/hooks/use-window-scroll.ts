"use client";

import { useEffect, useState } from "react";

interface UseWindowScrollOptions {
  threshold?: number;
}

// Helper to get the current scroll position from all possible sources
function getCurrentScrollY(): number {
  // Check all possible scroll positions and return the maximum
  // This handles both browser and Tauri environments
  const windowScrollY = window.scrollY || window.pageYOffset || 0;
  const htmlScrollTop = document.documentElement.scrollTop || 0;
  const bodyScrollTop = document.body.scrollTop || 0;

  return Math.max(windowScrollY, htmlScrollTop, bodyScrollTop);
}

export function useWindowScroll(options: UseWindowScrollOptions = {}) {
  const { threshold = 50 } = options;
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = getCurrentScrollY();

          setScrollY(currentScrollY);
          setIsScrolled(currentScrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial values
    handleScroll();

    // Listen to scroll events on all possible scrollable elements
    // This ensures we catch scroll events in both browser and Tauri environments
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.documentElement.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    document.body.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      document.documentElement.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return { scrollY, isScrolled };
}
