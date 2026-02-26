import { Skeleton } from "@midday/ui/skeleton";

export function UnderwritingSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-6 px-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Buy Box Card */}
      <div className="border border-border/40 shadow-sm rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`field-${i}`}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Upload Card */}
      <div className="border border-border/40 shadow-sm rounded-lg p-6">
        <Skeleton className="h-6 w-56 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}
