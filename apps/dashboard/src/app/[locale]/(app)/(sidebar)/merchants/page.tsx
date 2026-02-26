import { CollapsibleSummary } from "@/components/collapsible-summary";
import { MerchantSummarySkeleton } from "@/components/merchant-summary-skeleton";
import { MerchantsHeader } from "@/components/merchants-header";
import { ErrorFallback } from "@/components/error-fallback";
import { InactiveMerchants } from "@/components/inactive-merchants";
import { MostActiveMerchant } from "@/components/most-active-merchant";
import { NewMerchantsThisMonth } from "@/components/new-merchants-this-month";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/merchants/data-table";
import { MerchantsSkeleton } from "@/components/tables/merchants/skeleton";
import { TopRevenueMerchant } from "@/components/top-revenue-merchant";
import { loadMerchantFilterParams } from "@/hooks/use-merchant-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Merchants | Abacus",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadMerchantFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("merchants");

  // Prefetch merchant analytics
  batchPrefetch([
    trpc.merchants.get.infiniteQueryOptions({
      ...filter,
      sort,
    }),
    trpc.deal.mostActiveMerchant.queryOptions(),
    trpc.deal.inactiveMerchantsCount.queryOptions(),
    trpc.deal.topRevenueMerchant.queryOptions(),
    trpc.deal.newMerchantsCount.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <CollapsibleSummary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
              <Suspense fallback={<MerchantSummarySkeleton />}>
                <MostActiveMerchant />
              </Suspense>
              <Suspense fallback={<MerchantSummarySkeleton />}>
                <InactiveMerchants />
              </Suspense>
              <Suspense fallback={<MerchantSummarySkeleton />}>
                <TopRevenueMerchant />
              </Suspense>
              <Suspense fallback={<MerchantSummarySkeleton />}>
                <NewMerchantsThisMonth />
              </Suspense>
            </div>
          </CollapsibleSummary>

          <MerchantsHeader />

          <ErrorBoundary errorComponent={ErrorFallback}>
            <Suspense fallback={<MerchantsSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
