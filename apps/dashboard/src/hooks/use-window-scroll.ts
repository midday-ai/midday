"use client";

import { useEffect, useState } from "react";

interface UseWindowScrollOptions {
  threshold?: number;
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
          // Check both window.scrollY and document.documentElement.scrollTop
          // to support both browser and Tauri webview environments
          const windowScrollY = window.scrollY || 0;
          const documentScrollTop = document.documentElement.scrollTop || 0;
          const currentScrollY = Math.max(windowScrollY, documentScrollTop);

          setScrollY(currentScrollY);
          setIsScrolled(currentScrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial values
    handleScroll();

    // Listen to scroll events on both window and document
    // to support both browser and Tauri webview environments
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return { scrollY, isScrolled };
}
