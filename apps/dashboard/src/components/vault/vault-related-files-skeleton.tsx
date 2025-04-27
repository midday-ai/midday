import { Skeleton } from "@midday/ui/skeleton";
import { VaultItemSkeleton } from "./vault-item-skeleton";

type Props = {
  fullView?: boolean;
};

export function VaultRelatedFilesSkeleton({ fullView }: Props) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {/* Title Skeleton */}
        <Skeleton className="h-5 w-24" />
      </div>

      {/* Carousel Content Skeleton */}
      {fullView && (
        <div className="flex w-full space-x-4 overflow-hidden">
          {/* Render 3 Skeleton Items */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index.toString()} className="basis-1/3 flex-shrink-0">
              <VaultItemSkeleton small={fullView} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
