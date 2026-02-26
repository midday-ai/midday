import { ReconciliationSearchFilter } from "@/components/reconciliation-search-filter";
import { ReconciliationStats } from "@/components/reconciliation-stats";
import { ReconciliationTabs } from "@/components/reconciliation-tabs";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/reconciliation/data-table";
import { Loading } from "@/components/tables/reconciliation/loading";
import { loadReconciliationFilterParams } from "@/hooks/use-reconciliation-filter-params";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reconciliation | Abacus",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ReconciliationPage(props: Props) {
  const searchParams = await props.searchParams;
  const filter = loadReconciliationFilterParams(searchParams);

  batchPrefetch([
    trpc.reconciliation.getPaymentFeed.infiniteQueryOptions({
      matchStatus: filter.matchStatus ?? undefined,
      q: filter.q ?? undefined,
      start: filter.start ?? undefined,
      end: filter.end ?? undefined,
      bankAccountIds: filter.accounts ?? undefined,
      dealIds: filter.deals ?? undefined,
      confidenceMin: filter.confidenceMin ?? undefined,
    }),
    trpc.reconciliation.getStats.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-4 py-6">
          <Suspense fallback={<div className="h-12 bg-muted/50 rounded-lg animate-pulse" />}>
            <ReconciliationStats />
          </Suspense>

          <div className="flex justify-between items-center">
            <ReconciliationSearchFilter />
            <ReconciliationTabs />
          </div>
        </div>

        <Suspense fallback={<Loading />}>
          <ReconciliationContent tab={filter.tab} />
        </Suspense>
      </ScrollableContent>
    </HydrateClient>
  );
}

function ReconciliationContent({ tab }: { tab: string | null }) {
  if (tab === "reconcile") {
    // Dynamic import to keep initial bundle small
    const { ReconciliationWorkspace } = require("@/components/reconciliation/reconciliation-workspace");
    return <ReconciliationWorkspace />;
  }

  if (tab === "discrepancies") {
    const { DiscrepancyQueue } = require("@/components/reconciliation/discrepancy-queue");
    return <DiscrepancyQueue />;
  }

  // Default: Payment Feed
  return <DataTable />;
}
