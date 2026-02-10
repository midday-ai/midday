import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { CollapsibleSummary } from "@/components/collapsible-summary";
import { CustomerSummarySkeleton } from "@/components/customer-summary-skeleton";
import { CustomersHeader } from "@/components/customers-header";
import { ErrorFallback } from "@/components/error-fallback";
import { InactiveClients } from "@/components/inactive-clients";
import { MostActiveClient } from "@/components/most-active-client";
import { NewCustomersThisMonth } from "@/components/new-customers-this-month";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/customers/data-table";
import { CustomersSkeleton } from "@/components/tables/customers/skeleton";
import { TopRevenueClient } from "@/components/top-revenue-client";
import { loadCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/columns";

export const metadata: Metadata = {
  title: "Customers | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadCustomerFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  // Get unified table settings from cookie
  const initialSettings = await getInitialTableSettings("customers");

  // Prefetch customer analytics
  batchPrefetch([
    trpc.customers.get.infiniteQueryOptions({
      ...filter,
      sort,
    }),
    trpc.invoice.mostActiveClient.queryOptions(),
    trpc.invoice.inactiveClientsCount.queryOptions(),
    trpc.invoice.topRevenueClient.queryOptions(),
    trpc.invoice.newCustomersCount.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <CollapsibleSummary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
              <Suspense fallback={<CustomerSummarySkeleton />}>
                <MostActiveClient />
              </Suspense>
              <Suspense fallback={<CustomerSummarySkeleton />}>
                <InactiveClients />
              </Suspense>
              <Suspense fallback={<CustomerSummarySkeleton />}>
                <TopRevenueClient />
              </Suspense>
              <Suspense fallback={<CustomerSummarySkeleton />}>
                <NewCustomersThisMonth />
              </Suspense>
            </div>
          </CollapsibleSummary>

          <CustomersHeader />

          <ErrorBoundary errorComponent={ErrorFallback}>
            <Suspense fallback={<CustomersSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
