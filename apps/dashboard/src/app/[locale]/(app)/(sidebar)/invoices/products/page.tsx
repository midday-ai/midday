import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { ProductsSkeleton } from "@/components/tables/products/skeleton";
import { DataTable } from "@/components/tables/products/table";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Products | Midday",
};

export default function Page() {
  prefetch(
    trpc.invoiceProducts.get.queryOptions({
      sortBy: "recent",
      limit: 100,
      includeInactive: true,
    }),
  );

  return (
    <div className="max-w-screen-lg">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<ProductsSkeleton />}>
          <DataTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
