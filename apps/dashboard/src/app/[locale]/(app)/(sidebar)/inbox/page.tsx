import { Inbox } from "@/components/inbox";
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

  await queryClient.fetchInfiniteQuery(
    trpc.inbox.get.infiniteQueryOptions({
      order: params.order,
      filter: {
        ...filter,
        done: false,
      },
    }),
  );

  return (
    <Inbox>
      <Suspense fallback={<InboxViewSkeleton ascending />}>
        <InboxView />
      </Suspense>
    </Inbox>
  );
}
