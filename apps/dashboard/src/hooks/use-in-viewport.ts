import { useEffect, useRef, useState } from "react";

type UseInViewportOptions = IntersectionObserverInit & {
  rootMargin?: string;
};

/**
 * Hook to detect when an element enters the viewport using Intersection Observer.
 * Useful for lazy loading images or other content.
 *
 * @param options - Intersection Observer options (rootMargin, threshold, etc.)
 * @param options.rootMargin - Margin around root (default: "100px")
 * @returns Object with `ref` to attach to element and `isInView` boolean
 */
export function useInViewport(options?: UseInViewportOptions) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          // Unobserve after first intersection to avoid re-triggering
          observer.unobserve(element);
        }
      },
      {
        rootMargin: "100px", // Default: start loading 100px before entering viewport
        ...options, // Allow override of rootMargin and other options
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isInView };
}
