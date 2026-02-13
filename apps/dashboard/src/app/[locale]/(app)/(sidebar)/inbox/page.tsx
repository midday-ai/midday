import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { InboxContent } from "@/components/inbox/inbox-content";
import { InboxViewSkeleton } from "@/components/inbox/inbox-skeleton";
import { loadInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { loadInboxParams } from "@/hooks/use-inbox-params";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const filter = loadInboxFilterParams(searchParams);
  const params = loadInboxParams(searchParams);

  batchPrefetch([
    trpc.inbox.get.infiniteQueryOptions({
      order: params.order,
      sort: params.sort,
      ...filter,
      tab: filter.tab ?? "all",
    }),
    trpc.inboxAccounts.get.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <Suspense fallback={<InboxViewSkeleton />}>
        <InboxContent />
      </Suspense>
    </HydrateClient>
  );
}
