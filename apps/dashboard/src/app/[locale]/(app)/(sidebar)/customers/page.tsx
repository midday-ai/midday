import { CustomersHeader } from "@/components/customers-header";
import { ErrorFallback } from "@/components/error-fallback";
import { CustomersTable } from "@/components/tables/customers";
import { CustomersSkeleton } from "@/components/tables/customers/skeleton";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { searchParamsCache } from "./search-params";

export const metadata: Metadata = {
  title: "Customers | Midday",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const {
    q: query,
    sort,
    start,
    end,
    page,
  } = searchParamsCache.parse(searchParams);

  return (
    <div className="flex flex-col pt-6 gap-6">
      <CustomersHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<CustomersSkeleton />}>
          <CustomersTable
            query={query}
            sort={sort}
            start={start}
            end={end}
            page={page}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
