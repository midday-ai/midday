"use client";

import { LoadMore } from "@/components/load-more";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { TAB_ITEMS, useInboxParams } from "@/hooks/use-inbox-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { ScrollArea } from "@midday/ui/scroll-area";
import { TabsContent } from "@midday/ui/tabs";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { InboxDetails } from "./inbox-details";
import { InboxEmpty, NoResults } from "./inbox-empty";
import { InboxItem } from "./inbox-item";

export function InboxView() {
  const trpc = useTRPC();
  const { ref, inView } = useInView();
  const { data: user } = useUserQuery();
  const { params, setParams } = useInboxParams();
  const { params: filter, hasFilter } = useInboxFilterParams();

  const infiniteQueryOptions = trpc.inbox.get.infiniteQueryOptions(
    {
      order: params.order,
      filter: {
        ...filter,
        done: params.tab === "done",
      },
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  useRealtime({
    channelName: "realtime_inbox",
    table: "inbox",
    filter: `team_id=eq.${user?.team_id}`,
    onEvent: (payload) => {
      switch (payload.eventType) {
        case "INSERT":
        case "UPDATE": {
          refetch();
          setParams({
            ...params,
            inboxId: payload.new.id,
          });
          break;
        }
      }
    },
  });

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  if (hasFilter) {
    return <NoResults />;
  }

  if (!tableData?.length) {
    return <InboxEmpty />;
  }

  const selectedItem =
    tableData?.find((item) => item.id === params.inboxId) ?? tableData.at(0);

  return (
    <div className="flex flex-row space-x-8 mt-4">
      <div className="w-full h-full">
        <ScrollArea
          className="relative w-full h-[calc(100vh-180px)] overflow-hidden"
          hideScrollbar
        >
          <AnimatePresence initial={false}>
            {TAB_ITEMS.map((value) => (
              <TabsContent
                key={value}
                value={value}
                className="m-0 h-full space-y-4"
              >
                {tableData.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      height: { duration: 0.3 },
                    }}
                  >
                    <InboxItem item={item} />
                  </motion.div>
                ))}
              </TabsContent>
            ))}
          </AnimatePresence>

          <LoadMore ref={ref} hasNextPage={hasNextPage} />
        </ScrollArea>
      </div>

      <InboxDetails item={selectedItem} />
    </div>
  );
}
