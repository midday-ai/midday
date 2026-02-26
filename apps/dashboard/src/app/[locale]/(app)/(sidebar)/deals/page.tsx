import { CollapsibleSummary } from "@/components/collapsible-summary";
import { ErrorFallback } from "@/components/error-fallback";
import { DealHeader } from "@/components/deal-header";
import {
  DealPaymentScore,
  DealPaymentScoreSkeleton,
} from "@/components/deal-payment-score";
import { DealSummarySkeleton } from "@/components/deal-summary";
import { DealsOpen } from "@/components/deals-open";
import { DealsOverdue } from "@/components/deals-overdue";
import { DealsPaid } from "@/components/deals-paid";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/deals/data-table";
import { DealSkeleton } from "@/components/tables/deals/skeleton";
import { loadDealFilterParams } from "@/hooks/use-deal-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Deals | abacus",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadDealFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("deals");

  batchPrefetch([
    trpc.deal.get.infiniteQueryOptions({
      ...filter,
      sort,
    }),
    trpc.deal.dealSummary.queryOptions({
      statuses: ["draft", "scheduled", "unpaid"],
    }),
    trpc.deal.dealSummary.queryOptions({
      statuses: ["paid"],
    }),
    trpc.deal.dealSummary.queryOptions({
      statuses: ["overdue"],
    }),
    trpc.deal.paymentStatus.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <CollapsibleSummary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
              <Suspense fallback={<DealSummarySkeleton />}>
                <DealsOpen />
              </Suspense>
              <Suspense fallback={<DealSummarySkeleton />}>
                <DealsOverdue />
              </Suspense>
              <Suspense fallback={<DealSummarySkeleton />}>
                <DealsPaid />
              </Suspense>
              <Suspense fallback={<DealPaymentScoreSkeleton />}>
                <DealPaymentScore />
              </Suspense>
            </div>
          </CollapsibleSummary>

          <DealHeader />

          <ErrorBoundary errorComponent={ErrorFallback}>
            <Suspense fallback={<DealSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
