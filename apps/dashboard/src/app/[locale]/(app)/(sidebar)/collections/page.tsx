import { CollapsibleSummary } from "@/components/collapsible-summary";
import { CollectionsContent } from "@/components/collections/collections-content";
import { CollectionsHeader } from "@/components/collections/collections-header";
import {
  CollectionsSummary,
  CollectionsSummarySkeleton,
} from "@/components/collections/collections-summary";
import { ScrollableContent } from "@/components/scrollable-content";
import { loadCollectionsFilterParams } from "@/hooks/use-collections-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Collections | Abacus",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadCollectionsFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  const initialSettings = await getInitialTableSettings("collections");

  batchPrefetch([
    trpc.collections.getStats.queryOptions(),
    trpc.collections.get.infiniteQueryOptions({
      status: "active",
      sort,
    }),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <CollapsibleSummary>
            <Suspense fallback={<CollectionsSummarySkeleton />}>
              <CollectionsSummary />
            </Suspense>
          </CollapsibleSummary>

          <CollectionsHeader />

          <CollectionsContent initialSettings={initialSettings} />
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
