"use client";

import { Skeleton } from "@midday/ui/skeleton";

export function DocumentDetailsSkeleton() {
  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-full w-full" />
    </div>
  );
}
