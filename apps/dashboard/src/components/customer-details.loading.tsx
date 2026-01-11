import { Skeleton } from "@midday/ui/skeleton";

export function CustomerDetailsSkeleton() {
  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sticky Header Skeleton */}
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* General Accordion Skeleton */}
        <div className="border-b border-border py-4">
          <Skeleton className="h-5 w-20 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        {/* Details Accordion Skeleton */}
        <div className="border-b border-border py-4">
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Statement Section Skeleton */}
        <div className="pt-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>

          {/* Summary Stats Skeleton */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {["total", "paid", "outstanding", "invoices"].map((stat) => (
              <div key={stat} className="border border-border px-4 py-3">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="space-y-2">
            <div className="flex gap-4 py-2 bg-muted/50 px-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            {["row-1", "row-2", "row-3"].map((row) => (
              <div key={row} className="flex gap-4 py-3 px-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t border-border pt-4 mt-auto flex-shrink-0 w-full">
        <div className="px-6 flex justify-end">
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </div>
  );
}
