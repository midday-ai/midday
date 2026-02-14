import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { Inbox } from "@/components/inbox";
import { InboxConnectedEmpty } from "@/components/inbox/inbox-empty";
import { InboxGetStarted } from "@/components/inbox/inbox-get-started";
import { InboxViewSkeleton } from "@/components/inbox/inbox-skeleton";
import { InboxView } from "@/components/inbox/inbox-view";
import { loadInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { loadInboxParams } from "@/hooks/use-inbox-params";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;
  const filter = loadInboxFilterParams(searchParams);
  const params = loadInboxParams(searchParams);

  // Fetch inbox data and accounts in parallel
  const [data, accounts] = await Promise.all([
    queryClient.fetchInfiniteQuery(
      trpc.inbox.get.infiniteQueryOptions({
        order: params.order,
        sort: params.sort,
        ...filter,
        tab: filter.tab ?? "all",
      }),
    ),
    queryClient.fetchQuery(trpc.inboxAccounts.get.queryOptions()),
  ]);

  const hasInboxItems = (data?.pages?.[0]?.data?.length ?? 0) > 0;
  const hasConnectedAccounts = accounts && accounts.length > 0;
  // Exclude 'tab' from filter check since it's a navigation param, not a filter
  const hasFilter = Object.entries(filter).some(
    ([key, value]) => key !== "tab" && value !== null,
  );
  const isAllTab = !filter.tab || filter.tab === "all";

  // No accounts and no items (and no filter) -> show get started
  if (!hasConnectedAccounts && !hasInboxItems && !hasFilter) {
    return <InboxGetStarted />;
  }

  // Accounts exist and have been synced, but no items (and no filter, on "all" tab) -> show connected empty
  const hasSyncedAccounts = accounts?.some((a) => a.lastAccessed !== null);

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
    <HydrateClient>
      <Inbox>
        <Suspense fallback={<InboxViewSkeleton />}>
          <InboxView />
        </Suspense>
      </Inbox>
    </HydrateClient>
  );
}
