"use client";

import { LoadMore } from "@/components/load-more";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { TAB_ITEMS, useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { ScrollArea } from "@midday/ui/scroll-area";
import { TabsContent } from "@midday/ui/tabs";
import { useToast } from "@midday/ui/use-toast";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { InboxDetails } from "./inbox-details";
import { InboxEmpty } from "./inbox-empty";
import { InboxList } from "./inbox-list";

export function InboxView() {
  const trpc = useTRPC();
  const { ref, inView } = useInView();
  const { toast } = useToast();
  const { data: user } = useUserQuery();
  const { params } = useInboxParams();
  const { params: filter } = useInboxFilterParams();

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

  const { data, fetchNextPage, hasNextPage } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  if (!tableData?.length) {
    return <InboxEmpty inboxId={user?.team?.inbox_id} />;
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
          {TAB_ITEMS.map((value) => (
            <TabsContent key={value} value={value} className="m-0 h-full">
              <InboxList items={tableData} />
            </TabsContent>
          ))}

          <LoadMore ref={ref} hasNextPage={hasNextPage} />
        </ScrollArea>
      </div>

      <InboxDetails item={selectedItem} />
    </div>
  );
}
