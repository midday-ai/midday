import { Skeleton } from "@midday/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div>
      {/* Welcome section */}
      <div className="flex flex-col items-center text-center pt-6 pb-10 w-full">
        <Skeleton className="h-[46px] w-[280px]" />
        <Skeleton className="h-[20px] w-[360px] mt-3" />
      </div>

      {/* Chat input */}
      <Skeleton className="h-[60px] w-full" />

      {/* Quick actions */}
      <div className="flex items-center justify-center gap-3 pt-2 pb-12 w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`action-${i}`} className="h-[30px] w-[120px]" />
        ))}
      </div>

      {/* Widget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`card-${i}`}
            className="border border-border p-5 min-h-[110px] flex flex-col justify-between"
          >
            <Skeleton className="h-[14px] w-[80px]" />
            <Skeleton className="h-[28px] w-[100px] mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
