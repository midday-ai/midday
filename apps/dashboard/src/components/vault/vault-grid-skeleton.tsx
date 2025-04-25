import { Skeleton } from "@repo/ui/components/skeleton";

function VaultItemSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    </div>
  );
}

export function VaultGridSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-6 gap-8 auto-rows-fr">
        {Array.from({ length: 12 }).map((_, index) => (
          <VaultItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
