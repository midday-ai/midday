import { CustomersHeader } from "@/components/customers-header";
import { ErrorFallback } from "@/components/error-fallback";
import { InactiveClients } from "@/components/inactive-clients";
import { InvoiceSummarySkeleton } from "@/components/invoice-summary";
import { MostActiveClient } from "@/components/most-active-client";
import { NewCustomersThisMonth } from "@/components/new-customers-this-month";
import { DataTable } from "@/components/tables/customers/data-table";
import { CustomersSkeleton } from "@/components/tables/customers/skeleton";
import { TopRevenueClient } from "@/components/top-revenue-client";
import { loadCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Customers | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;

  const filter = loadCustomerFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  // Change this to prefetch once this is fixed: https://github.com/trpc/trpc/issues/6632
  await queryClient.fetchInfiniteQuery(
    trpc.customers.get.infiniteQueryOptions({
      ...filter,
      sort,
    }),
  );

  // Prefetch customer analytics
  batchPrefetch([
    trpc.invoice.mostActiveClient.queryOptions(),
    trpc.invoice.inactiveClientsCount.queryOptions(),
    trpc.invoice.topRevenueClient.queryOptions(),
    trpc.invoice.newCustomersCount.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
          <Suspense fallback={<InvoiceSummarySkeleton />}>
            <MostActiveClient />
          </Suspense>
          <Suspense fallback={<InvoiceSummarySkeleton />}>
            <InactiveClients />
          </Suspense>
          <Suspense fallback={<InvoiceSummarySkeleton />}>
            <TopRevenueClient />
          </Suspense>
          <Suspense fallback={<InvoiceSummarySkeleton />}>
            <NewCustomersThisMonth />
          </Suspense>
        </div>

        <CustomersHeader />

        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<CustomersSkeleton />}>
            <DataTable />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrateClient>
  );
}
