import { CategoriesTable } from "@/components/tables/categories";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Midday",
};

export default function Categories() {
  return (
    <div className="space-y-12">
      <Suspense>
        <CategoriesTable />
      </Suspense>
    </div>
  );
}
