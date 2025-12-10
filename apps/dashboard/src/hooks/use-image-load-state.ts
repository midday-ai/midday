import { useEffect, useRef, useState } from "react";

/**
 * Hook to manage image loading state, including detection of cached images.
 * Handles cases where onLoad doesn't fire for cached images.
 *
 * @param src - The image source URL
 * @returns Object with loading state, error state, and image ref
 */
export function useImageLoadState(src: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset state when src changes
  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setIsError(false);
      return;
    }
    setIsLoading(true);
    setIsError(false);
  }, [src]);

  // Check if image is already loaded from cache after render
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    const checkLoaded = () => {
      if (img.complete) {
        if (img.naturalHeight !== 0) {
          setIsLoading(false);
        } else {
          setIsError(true);
          setIsLoading(false);
        }
      }
    };

    // Check immediately and after a brief delay to catch cached images
    checkLoaded();
    const timeoutId = setTimeout(checkLoaded, 0);
    const rafId = requestAnimationFrame(checkLoaded);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoading(false);
  };

  return {
    isLoading,
    isError,
    imgRef,
    handleLoad,
    handleError,
  };
}
