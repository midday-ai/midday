"use client";

import { LoadMore } from "@/components/load-more";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
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
import { useDebounceCallback } from "usehooks-ts";
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

  const allSeenIdsRef = useRef(new Set<string>());

  const infiniteQueryOptions = trpc.inbox.get.infiniteQueryOptions(
    {
      order: params.order,
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

  const debouncedEventHandler = useDebounceCallback(() => {
    refetch();

    queryClient.invalidateQueries({
      queryKey: trpc.inbox.getById.queryKey(),
    });
  }, 50);

  useRealtime({
    channelName: "realtime_inbox",
    table: "inbox",
    filter: `team_id=eq.${user?.teamId}`,
    onEvent: (payload) => {
      console.log(payload);
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        debouncedEventHandler();
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
    if (!params.inboxId) {
      setParams({
        ...params,
        inboxId: tableData.at(0)?.id,
      });
    }
  }, [tableData]);

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
        setParams({
          ...params,
          inboxId: nextItem?.id,
        });
      }
    },
    [tableData, params, setParams],
  );

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
                    <InboxItem item={item} index={index} />
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          <LoadMore ref={ref} hasNextPage={hasNextPage} />
        </ScrollArea>
      </div>

      <InboxDetails />
    </div>
  );
}
