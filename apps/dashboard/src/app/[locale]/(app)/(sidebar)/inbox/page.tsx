import { Inbox } from "@/components/inbox";
import { InboxGetStarted } from "@/components/inbox/inbox-get-started";
import { InboxViewSkeleton } from "@/components/inbox/inbox-skeleton";
import { InboxView } from "@/components/inbox/inbox-view";
import { loadInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { loadInboxParams } from "@/hooks/use-inbox-params";
import { getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

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

  // Change this to prefetch once this is fixed: https://github.com/trpc/trpc/issues/6632
  const data = await queryClient.fetchInfiniteQuery(
    trpc.inbox.get.infiniteQueryOptions({
      order: params.order,
      filter,
    }),
  );

  if (
    data.pages[0]?.data.length === 0 &&
    !Object.values(filter).some((value) => value !== null)
  ) {
    return <InboxGetStarted />;
  }

  return (
    <Inbox>
      <Suspense fallback={<InboxViewSkeleton />}>
        <InboxView />
      </Suspense>
    </Inbox>
  );
}
