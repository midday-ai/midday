"use client";

import { Skeleton } from "@midday/ui/skeleton";

export function InvoiceDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 mt-1 items-center">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="flex justify-between items-center mt-6 mb-3 relative">
        <div className="flex flex-col w-full space-y-1">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="mt-8 flex flex-col space-y-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="mt-6 flex flex-col space-y-4 border-t border-border pt-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index.toString()}
            className="flex justify-between items-center"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col space-y-2 border-t border-border pt-6">
        <Skeleton className="h-4 w-24" />
        <div className="flex w-full gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="mt-6">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
