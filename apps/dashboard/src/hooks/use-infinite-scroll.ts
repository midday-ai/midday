"use client";

import type { Virtualizer } from "@tanstack/react-virtual";
import { type RefObject, useEffect } from "react";

interface UseInfiniteScrollProps<
  TScrollElement extends HTMLElement = HTMLElement,
> {
  /** Ref to the scroll container element */
  scrollRef: RefObject<TScrollElement | null>;
  /** The virtualizer instance */
  rowVirtualizer: Virtualizer<TScrollElement, Element>;
  /** Total number of rows */
  rowCount: number;
  /** Whether there are more pages to fetch */
  hasNextPage: boolean;
  /** Whether currently fetching next page */
  isFetchingNextPage: boolean;
  /** Function to fetch the next page */
  fetchNextPage: () => void;
  /** Number of rows from the end to trigger loading (default: 20) */
  threshold?: number;
}

/**
 * Hook for infinite scroll with virtualization
 * Automatically fetches next page when scrolling near the bottom
 */
export function useInfiniteScroll<
  TScrollElement extends HTMLElement = HTMLElement,
>({
  scrollRef,
  rowVirtualizer,
  rowCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 20,
}: UseInfiniteScrollProps<TScrollElement>) {
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const checkLoadMore = () => {
      if (isFetchingNextPage) return;

      const virtualItems = rowVirtualizer.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];

      if (lastItem && lastItem.index >= rowCount - threshold && hasNextPage) {
        fetchNextPage();
      }
    };

    // Initial check
    checkLoadMore();

    scrollElement.addEventListener("scroll", checkLoadMore);
    return () => scrollElement.removeEventListener("scroll", checkLoadMore);
  }, [
    scrollRef,
    rowVirtualizer,
    rowCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold,
  ]);
}
