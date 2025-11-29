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
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);
          setIsScrolled(currentScrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial values
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return { scrollY, isScrolled };
}

