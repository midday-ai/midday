import { SyndicationsHeader } from "@/components/syndications-header";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { SyndicationsDataTable } from "@/components/tables/syndications/data-table";
import { SyndicationsSkeleton } from "@/components/tables/syndications/skeleton";
import { loadSortParams } from "@/hooks/use-sort-params";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Syndications | Abacus",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const { sort } = loadSortParams(searchParams);
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  batchPrefetch([
    trpc.syndication.get.queryOptions({
      sort,
      q,
    }),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <SyndicationsHeader />

          <ErrorBoundary errorComponent={ErrorFallback}>
            <Suspense fallback={<SyndicationsSkeleton />}>
              <SyndicationsDataTable />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
