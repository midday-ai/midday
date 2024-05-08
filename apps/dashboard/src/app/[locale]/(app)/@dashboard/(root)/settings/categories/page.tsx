import { CategoriesTable } from "@/components/tables/categories";
import { CategoriesSkeleton } from "@/components/tables/categories/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Midday",
};

export default function Categories() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesTable />
    </Suspense>
  );
}
