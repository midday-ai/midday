import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { CategoriesSkeleton } from "@/components/tables/categories/skeleton";
import { DataTable } from "@/components/tables/categories/table";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Categories | Midday",
};

export default async function Categories() {
  prefetch(trpc.transactionCategories.get.queryOptions());

  return (
    <div className="max-w-screen-lg">
      <HydrateClient>
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<CategoriesSkeleton />}>
            <DataTable />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </div>
  );
}
