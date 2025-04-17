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
import { AnimatePresence, type Variants, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { useDebouncedCallback } from "use-debounce";
import { InboxDetails } from "./inbox-details";
import { NoResults } from "./inbox-empty";
import { InboxItem } from "./inbox-item";

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.1, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.08, ease: "easeIn" },
  },
};

export function InboxView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const { data: user } = useUserQuery();
  const { params, setParams } = useInboxParams();
  const { params: filter, hasFilter } = useInboxFilterParams();

  const infiniteQueryOptions = trpc.inbox.get.infiniteQueryOptions(
    {
      order: params.order,
      filter: {
        ...filter,
      },
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

  const debouncedEventHandler = useDebouncedCallback(() => {
    refetch();

    queryClient.invalidateQueries({
      queryKey: trpc.inbox.getById.queryKey(),
    });

    // Set the first item as the selected item
    const inboxId = tableData.at(0)?.id;

    if (inboxId) {
      setParams({
        ...params,
        inboxId,
      });
    }
  }, 500);

  useRealtime({
    channelName: "realtime_inbox",
    table: "inbox",
    filter: `team_id=eq.${user?.team_id}`,
    onEvent: (payload) => {
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
              {tableData.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  variants={itemVariants}
                  initial={false}
                  animate="visible"
                  exit="exit"
                >
                  <InboxItem item={item} index={index} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          <LoadMore ref={ref} hasNextPage={hasNextPage} />
        </ScrollArea>
      </div>

      <InboxDetails firstItemId={tableData.at(0)?.id} />
    </div>
  );
}
