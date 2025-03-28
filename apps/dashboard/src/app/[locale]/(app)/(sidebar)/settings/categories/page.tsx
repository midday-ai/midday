import { CategoriesSkeleton } from "@/components/tables/categories/skeleton";
import { DataTable } from "@/components/tables/categories/table";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Midday",
};

export default async function Categories() {
  prefetch(trpc.transactionCategories.get.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<CategoriesSkeleton />}>
        <DataTable />
      </Suspense>
    </HydrateClient>
  );
}
