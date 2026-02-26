import { Skeleton } from "@midday/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-[400px]" />
    </div>
  );
}
