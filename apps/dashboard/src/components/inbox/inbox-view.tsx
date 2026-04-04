"use client";

import {
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceCallback } from "usehooks-ts";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useMatchSound } from "@/hooks/use-match-sound";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useInboxStore } from "@/store/inbox";
import { useTRPC } from "@/trpc/client";
import { InboxBulkActions } from "./inbox-bulk-actions";
import { InboxDetails } from "./inbox-details";
import { InboxConnectedEmpty, InboxOtherEmpty, NoResults } from "./inbox-empty";
import { InboxItem } from "./inbox-item";
import { InboxViewSkeleton } from "./inbox-skeleton";

const ITEM_HEIGHT = 90;
const ITEM_GAP = 16;

export function InboxView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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

  const realtimeInsertIdsRef = useRef(new Set<string>());
  const animatedIdsRef = useRef(new Set<string>());
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);

  // State to track if timeout has been reached (for showing empty state)
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Capture the "just connected" state locally so it persists even after URL params are cleared
  // (AppConnectionToast clears params after 100ms, but we need this state for the 60s timeout)
  const [wasJustConnected, setWasJustConnected] = useState(
    () => params.connected === true,
  );

  // Update local state when params.connected becomes truthy
  useEffect(() => {
    if (params.connected === true) {
      setWasJustConnected(true);
    }
  }, [params.connected]);

  const infiniteQueryOptions = trpc.inbox.get.infiniteQueryOptions(
    {
      order: params.inboxOrder,
      sort: params.inboxSort,
      ...filter,
      tab: filter.tab ?? "all", // Default to "all" tab
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  // Clear the "just connected" state once we have data or timeout fires
  useEffect(() => {
    if (wasJustConnected && (tableData.length > 0 || hasTimedOut)) {
      setWasJustConnected(false);
    }
    // Reset hasTimedOut when data arrives after timeout - prevents showing
    // InboxConnectedEmpty if user later deletes all items
    if (hasTimedOut && tableData.length > 0) {
      setHasTimedOut(false);
    }
  }, [wasJustConnected, tableData.length, hasTimedOut]);

  // Timeout configuration - wait 1 minute for sync to complete
  const SYNC_TIMEOUT = 60 * 1000; // 1 minute

  // Set up timeout to show empty state if no items appear
  useEffect(() => {
    // Only set timeout if user just connected and no items yet
    if (!wasJustConnected || tableData.length > 0 || hasTimedOut) {
      return;
    }

    const timeout = setTimeout(() => {
      setHasTimedOut(true);
    }, SYNC_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [wasJustConnected, tableData.length, hasTimedOut]);

  const debouncedRefetch = useDebounceCallback(() => {
    refetch();
  }, 200);

  useRealtime({
    channelName: "realtime_inbox",
    table: "inbox",
    filter: `team_id=eq.${user?.teamId}`,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT") {
        const id = payload.new?.id;
        if (id) realtimeInsertIdsRef.current.add(id);
        debouncedRefetch();
      }

      if (payload.eventType === "UPDATE") {
        const record = payload.new;
        if (!record?.id) return;

        const prevStatus =
          tableData.find((item) => item.id === record.id)?.status ?? null;

        const wasProcessing =
          prevStatus === "new" || prevStatus === "processing";
        const doneProcessing =
          record.status !== "new" && record.status !== "processing";

        if (wasProcessing && doneProcessing) {
          debouncedRefetch();
        } else if (record.status && record.status !== prevStatus) {
          queryClient.setQueriesData(
            { queryKey: trpc.inbox.get.infiniteQueryKey() },
            (old: any) => {
              if (!old?.pages) return old;
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  data: page.data.map((item: any) =>
                    item.id === record.id
                      ? { ...item, status: record.status }
                      : item,
                  ),
                })),
              };
            },
          );
        }

        if (record.id === params.inboxId) {
          queryClient.invalidateQueries({
            queryKey: trpc.inbox.getById.queryKey({ id: params.inboxId }),
          });
        }

        if (
          record.status === "suggested_match" &&
          prevStatus !== "suggested_match"
        ) {
          playMatchSound();
        }

        if (
          record.status !== prevStatus &&
          (record.status === "done" ||
            record.status === "suggested_match" ||
            prevStatus === "done" ||
            prevStatus === "suggested_match")
        ) {
          queryClient.invalidateQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          });
        }
      }
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT + ITEM_GAP,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (
      lastItem &&
      lastItem.index >= tableData.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    tableData.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const newItemIds = useMemo(() => {
    const newIds = new Set<string>();

    for (const item of tableData) {
      if (realtimeInsertIdsRef.current.has(item.id)) {
        newIds.add(item.id);
      }
    }

    return newIds;
  }, [tableData]);

  useEffect(() => {
    for (const id of newItemIds) {
      realtimeInsertIdsRef.current.delete(id);
    }
  }, [newItemIds]);

  useEffect(() => {
    if (tableData.length > 0) {
      const currentInList = tableData.some(
        (item) => item.id === params.inboxId,
      );

      // Auto-select first item if nothing selected or current selection isn't in the list
      if (!params.inboxId || !currentInList) {
        setParams({
          ...params,
          inboxId: tableData.at(0)?.id,
        });
      }
    } else if (params.inboxId) {
      // Clear selection when list is empty
      setParams({
        ...params,
        inboxId: null,
      });
    }
  }, [tableData, params.inboxId, setParams]);

  // Clear lastClickedIndex when sort/filter/tab params change
  // since item positions in tableData will change
  useEffect(() => {
    setLastClickedIndex(null);
  }, [
    params.inboxSort,
    params.inboxOrder,
    filter.q,
    filter.status,
    filter.tab,
  ]);

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

  useEffect(() => {
    const inboxId = params.inboxId;
    if (!inboxId || !shouldScrollRef.current) return;

    const index = tableData.findIndex((item) => item.id === inboxId);
    if (index >= 0) {
      rowVirtualizer.scrollToIndex(index, {
        align: "center",
        behavior: "smooth",
      });
    }

    shouldScrollRef.current = false;
  }, [params.inboxId, tableData, rowVirtualizer]);

  // If user just connected and no items yet, show skeleton while waiting for sync
  // (realtime will push items if found, timeout will trigger empty state if not)
  if (wasJustConnected && !tableData?.length && !hasTimedOut) {
    return <InboxViewSkeleton />;
  }

  // If timeout reached with no items, show connected empty state (only on "all" tab)
  const isAllTab = !filter.tab || filter.tab === "all";

  if (isAllTab && hasTimedOut && !tableData?.length && !hasFilter) {
    return <InboxConnectedEmpty />;
  }

  // Show empty state for "other" tab when no items
  if (!isAllTab && !tableData?.length && !hasFilter) {
    return <InboxOtherEmpty />;
  }

  if (hasFilter && !tableData?.length) {
    return <NoResults />;
  }

  return (
    <div className="flex flex-row space-x-8 mt-4">
      <div className="w-full h-full">
        <div
          ref={parentRef}
          className="relative w-full overflow-auto scrollbar-hide"
          style={{ height: "calc(100vh - 180px)" }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const item = tableData[virtualRow.index];
              if (!item) return null;
              const shouldAnimate =
                newItemIds.has(item.id) && !animatedIdsRef.current.has(item.id);

              if (shouldAnimate) {
                animatedIdsRef.current.add(item.id);
              }

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${ITEM_HEIGHT}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    contain: "layout style paint",
                  }}
                >
                  <motion.div
                    initial={
                      shouldAnimate
                        ? { opacity: 0, y: -30, scale: 0.95 }
                        : false
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                      shouldAnimate
                        ? {
                            duration: 0.4,
                            ease: [0.23, 1, 0.32, 1],
                            delay:
                              virtualRow.index < 5
                                ? virtualRow.index * 0.05
                                : 0,
                          }
                        : { duration: 0 }
                    }
                  >
                    <InboxItem
                      item={item}
                      index={virtualRow.index}
                      onItemClick={handleItemClick}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <InboxDetails />
      <InboxBulkActions />
    </div>
  );
}
