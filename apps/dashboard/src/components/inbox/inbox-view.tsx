"use client";

import { LoadMore } from "@/components/load-more";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useMatchSound } from "@/hooks/use-match-sound";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useInboxStore } from "@/store/inbox";
import { useTRPC } from "@/trpc/client";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useInView } from "react-intersection-observer";
import { useBoolean, useCounter, useDebounceCallback } from "usehooks-ts";
import { InboxBulkActions } from "./inbox-bulk-actions";
import { InboxDetails } from "./inbox-details";
import { NoResults } from "./inbox-empty";
import { InboxItem } from "./inbox-item";
import { InboxViewSkeleton } from "./inbox-skeleton";

export function InboxView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const { data: user } = useUserQuery();
  const { params, setParams } = useInboxParams();
  const { params: filter, hasFilter } = useInboxFilterParams();
  const {
    lastClickedIndex,
    selectRange,
    setLastClickedIndex,
    toggleSelection,
  } = useInboxStore();
  const { play: playMatchSound } = useMatchSound();

  const allSeenIdsRef = useRef(new Set<string>());
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollAreaViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);

  const infiniteQueryOptions = trpc.inbox.get.infiniteQueryOptions(
    {
      order: params.order,
      sort: params.sort,
      ...filter,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  // Enhanced batching mechanism using usehooks-ts
  const {
    count: updateCount,
    increment: incrementUpdates,
    reset: resetUpdates,
  } = useCounter(0);
  const {
    value: hasMatchingChanges,
    setTrue: setHasMatchingChanges,
    setFalse: resetMatchingChanges,
  } = useBoolean(false);

  const MAX_BATCH_SIZE = 10;

  // Helper to check if update affects transaction matching
  const checkMatchingChanges = (payload: any) => {
    if (payload?.new) {
      const newRecord = payload.new;
      const oldRecord = payload.old;

      // Play sound when transitioning to suggested_match
      if (
        newRecord.status === "suggested_match" &&
        oldRecord?.status !== "suggested_match"
      ) {
        playMatchSound();
      }

      return (
        newRecord.status !== oldRecord?.status &&
        (newRecord.status === "done" ||
          newRecord.status === "suggested_match" ||
          oldRecord?.status === "done" ||
          oldRecord?.status === "suggested_match")
      );
    }
    return false;
  };

  // Refresh function that handles invalidations
  const performRefresh = (shouldInvalidateTransactions: boolean) => {
    refetch();

    queryClient.invalidateQueries({
      queryKey: trpc.inbox.getById.queryKey(),
    });

    if (shouldInvalidateTransactions) {
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.infiniteQueryKey(),
      });
    }
  };

  // Debounced handler for regular updates
  const debouncedRefresh = useDebounceCallback(() => {
    performRefresh(hasMatchingChanges);
    resetUpdates();
    resetMatchingChanges();
  }, 200);

  // Main batch handler
  const batchedUpdateHandler = (payload: any) => {
    incrementUpdates();

    // Check if this update affects transaction matching
    if (checkMatchingChanges(payload)) {
      setHasMatchingChanges();
    }

    // Force immediate update for bulk operations
    if (updateCount >= MAX_BATCH_SIZE) {
      performRefresh(hasMatchingChanges);
      resetUpdates();
      resetMatchingChanges();
      return;
    }

    // Use debounced update for smaller batches
    debouncedRefresh();
  };

  useRealtime({
    channelName: "realtime_inbox",
    table: "inbox",
    filter: `team_id=eq.${user?.teamId}`,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        batchedUpdateHandler(payload);
      }
    },
  });

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const newItemIds = useMemo(() => {
    const newIds = new Set<string>();

    for (const item of tableData) {
      if (!allSeenIdsRef.current.has(item.id)) {
        newIds.add(item.id);
        allSeenIdsRef.current.add(item.id);
      }
    }

    return newIds;
  }, [tableData]);

  useEffect(() => {
    if (!params.inboxId && tableData.length > 0) {
      setParams({
        ...params,
        inboxId: tableData.at(0)?.id,
      });
    }
  }, [tableData, params.inboxId, setParams]);

  // Clear lastClickedIndex when sort/filter params change
  // since item positions in tableData will change
  useEffect(() => {
    setLastClickedIndex(null);
  }, [params.sort, params.order, filter.q, filter.status]);

  // Arrow key navigation
  useHotkeys(
    "up",
    (event) => {
      event.preventDefault();
      const currentIndex = tableData.findIndex(
        (item) => item.id === params.inboxId,
      );

      if (currentIndex > 0) {
        const prevItem = tableData[currentIndex - 1];
        shouldScrollRef.current = true;
        setParams({
          ...params,
          inboxId: prevItem?.id,
        });
      }
    },
    [tableData, params, setParams],
  );

  useHotkeys(
    "down",
    (event) => {
      event.preventDefault();
      const currentIndex = tableData.findIndex(
        (item) => item.id === params.inboxId,
      );

      if (currentIndex < tableData.length - 1) {
        const nextItem = tableData[currentIndex + 1];
        shouldScrollRef.current = true;
        setParams({
          ...params,
          inboxId: nextItem?.id,
        });
      }
    },
    [tableData, params, setParams],
  );

  // Handle item click for selection
  const handleItemClick = (e: React.MouseEvent, index: number) => {
    if (e.shiftKey && lastClickedIndex !== null) {
      // Shift-click: select range
      selectRange(lastClickedIndex, index, tableData);
      setLastClickedIndex(index);
    } else {
      // Regular click: toggle selection
      const item = tableData[index];
      if (item) {
        toggleSelection(item.id);
        setLastClickedIndex(index);
      }
    }
  };

  // Scroll selected inbox item to center of viewport (only on keyboard navigation)
  useEffect(() => {
    const inboxId = params.inboxId;
    if (!inboxId) return;

    // Only scroll if navigation was triggered by keyboard
    if (!shouldScrollRef.current) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const itemElement = itemRefs.current.get(inboxId);
      const viewport = scrollAreaViewportRef.current;
      if (!itemElement || !viewport) {
        shouldScrollRef.current = false;
        return;
      }

      // Calculate position relative to viewport
      const viewportRect = viewport.getBoundingClientRect();
      const itemRect = itemElement.getBoundingClientRect();

      // Calculate current scroll position
      const itemTop = itemRect.top - viewportRect.top + viewport.scrollTop;
      const itemHeight = itemRect.height;
      const viewportHeight = viewport.clientHeight;

      // Center the item in the viewport
      const scrollPosition = itemTop - viewportHeight / 2 + itemHeight / 2;

      // Scroll the viewport directly (not the window)
      viewport.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: "smooth",
      });

      // Reset the flag after scrolling
      shouldScrollRef.current = false;
    });
  }, [params.inboxId, tableData]);

  // If user is connected, and we don't have any data, we need to show a skeleton
  if (params.connected && !tableData?.length) {
    return <InboxViewSkeleton />;
  }

  if (hasFilter && !tableData?.length) {
    return <NoResults />;
  }

  return (
    <div className="flex flex-row space-x-8 mt-4">
      <div className="w-full h-full">
        <ScrollArea
          ref={(node) => {
            scrollAreaViewportRef.current = node as HTMLDivElement | null;
          }}
          className="relative w-full h-[calc(100vh-180px)] overflow-hidden"
          hideScrollbar
        >
          <AnimatePresence initial={false}>
            <div className="m-0 h-full space-y-4">
              {tableData.map((item, index) => {
                const isNewItem = newItemIds.has(item.id);

                return (
                  <motion.div
                    key={item.id}
                    initial={
                      isNewItem ? { opacity: 0, y: -30, scale: 0.95 } : false
                    }
                    animate={
                      isNewItem ? { opacity: 1, y: 0, scale: 1 } : "visible"
                    }
                    transition={
                      isNewItem
                        ? {
                            duration: 0.4,
                            ease: [0.23, 1, 0.32, 1],
                            delay: index < 5 ? index * 0.05 : 0,
                          }
                        : undefined
                    }
                    exit="exit"
                  >
                    <InboxItem
                      ref={(el) => {
                        if (el) {
                          itemRefs.current.set(item.id, el);
                        } else {
                          itemRefs.current.delete(item.id);
                        }
                      }}
                      item={item}
                      index={index}
                      onItemClick={handleItemClick}
                    />
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          <LoadMore ref={ref} hasNextPage={hasNextPage} />
        </ScrollArea>
      </div>

      <InboxDetails />
      <InboxBulkActions />
    </div>
  );
}
