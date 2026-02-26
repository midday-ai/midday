"use client";

import { useCollectionsFilterParams } from "@/hooks/use-collections-filter-params";
import { ErrorFallback } from "@/components/error-fallback";
import { DataTable } from "@/components/tables/collections/data-table";
import { CandidatesTable } from "@/components/tables/collections/candidates-table";
import { CollectionsSkeleton } from "@/components/tables/collections/skeleton";
import type { TableSettings } from "@/utils/table-settings";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";

type Props = {
  initialSettings?: Partial<TableSettings>;
};

export function CollectionsContent({ initialSettings }: Props) {
  const { filter } = useCollectionsFilterParams();
  const tab = filter.tab || "active";

  if (tab === "candidates") {
    return (
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<CollectionsSkeleton />}>
          <CandidatesTable />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary errorComponent={ErrorFallback}>
      <Suspense fallback={<CollectionsSkeleton />}>
        <DataTable initialSettings={initialSettings} />
      </Suspense>
    </ErrorBoundary>
  );
}
