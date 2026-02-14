"use client";

import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useTRPC } from "@/trpc/client";
import { InboxConnectedEmpty } from "./inbox-empty";
import { InboxGetStarted } from "./inbox-get-started";
import { InboxView } from "./inbox-view";
import { Inbox } from "./index";

export function InboxContent() {
  const trpc = useTRPC();
  const { params } = useInboxParams();
  const { params: filter, hasFilter } = useInboxFilterParams();

  const { data } = useSuspenseInfiniteQuery(
    trpc.inbox.get.infiniteQueryOptions(
      {
        order: params.order,
        sort: params.sort,
        ...filter,
        tab: filter.tab ?? "all",
      },
      {
        getNextPageParam: ({ meta }) => meta?.cursor,
      },
    ),
  );

  const { data: accounts } = useSuspenseQuery(
    trpc.inboxAccounts.get.queryOptions(),
  );

  const hasInboxItems = (data?.pages?.[0]?.data?.length ?? 0) > 0;
  const hasConnectedAccounts = accounts && accounts.length > 0;

  // No accounts and no items (and no filter) -> show get started
  if (!hasConnectedAccounts && !hasInboxItems && !hasFilter) {
    return <InboxGetStarted />;
  }

  // Accounts exist and have been synced, but no items (and no filter) -> show connected empty
  const hasSyncedAccounts = accounts?.some((a) => a.lastAccessed !== null);

  const isAllTab = !filter.tab || filter.tab === "all";

  if (
    isAllTab &&
    hasConnectedAccounts &&
    hasSyncedAccounts &&
    !hasInboxItems &&
    !hasFilter &&
    !params.connected
  ) {
    return (
      <Inbox>
        <InboxConnectedEmpty />
      </Inbox>
    );
  }

  return (
    <Inbox>
      <InboxView />
    </Inbox>
  );
}
