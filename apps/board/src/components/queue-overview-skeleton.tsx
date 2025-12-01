import { Skeleton } from "@midday/ui/skeleton";

export function QueueOverviewSkeleton() {
  return (
    <>
      {/* Chart Section Skeleton */}
      <div className="mb-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-[18px] w-32" />
        </div>
        <Skeleton className="h-[320px] w-full" />
      </div>

      {/* Queue Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border bg-background text-card-foreground rounded-lg"
          >
            <div className="flex flex-col space-y-1.5 p-6">
              <Skeleton className="h-[30px] w-32" />
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

