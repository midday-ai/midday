import { Skeleton } from "@midday/ui/skeleton";

export function BrokersSkeleton() {
  return (
    <div className="w-full">
      <div className="border-b border-border py-3 px-4">
        <Skeleton className="h-4 w-full max-w-[600px]" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`broker-skeleton-${i}`}
          className="border-b border-border py-3 px-4 flex gap-4"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
