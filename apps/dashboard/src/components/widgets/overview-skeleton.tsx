import { Skeleton } from "@midday/ui/skeleton";

export function SummarySkeleton() {
  return (
    <div className="flex flex-col items-center max-w-lg w-full gap-3">
      <div className="h-10 flex items-center">
        <Skeleton className="h-[14px] w-[280px]" />
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`dot-${i}`}
            className="h-[2px] w-4 rounded-full bg-primary/10"
          />
        ))}
      </div>
    </div>
  );
}

export function WidgetCardsSkeleton() {
  return (
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
  );
}
