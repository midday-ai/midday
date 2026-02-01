"use client";

import { ForesightManager, type ForesightRegisterOptions } from "js.foresight";
import { useEffect, useRef } from "react";

type UseForesightOptions = Omit<ForesightRegisterOptions, "element">;

// Initialize ForesightManager once (singleton)
let initialized = false;
function ensureInitialized() {
  if (!initialized && typeof window !== "undefined") {
    ForesightManager.initialize();
    initialized = true;
  }
}

/**
 * React hook for ForesightJS - predictive prefetching based on cursor trajectory.
 * Instead of prefetching all links in the viewport, this only prefetches when
 * the user's cursor is moving toward a link.
 *
 * @see https://foresightjs.com/docs/react/hook/
 */
export function useForesight<T extends HTMLElement>(
  options: UseForesightOptions,
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    ensureInitialized();

    const element = elementRef.current;
    if (!element) return;

    const { unregister } = ForesightManager.instance.register({
      element,
      ...options,
    });

    return () => {
      unregister();
    };
  }, [
    options.callback,
    options.hitSlop,
    options.name,
    options.meta,
    options.reactivateAfter,
  ]);

  return { elementRef };
}
