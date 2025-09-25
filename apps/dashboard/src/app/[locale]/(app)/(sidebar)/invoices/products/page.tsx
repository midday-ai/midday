import { ProductsSkeleton } from "@/components/tables/products/skeleton";
import { DataTable } from "@/components/tables/products/table";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

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
      <Suspense fallback={<ProductsSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
