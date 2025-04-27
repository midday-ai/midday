"use client";

import { SheetHeader } from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import { VaultRelatedFilesSkeleton } from "./vault/vault-related-files-skeleton";

type Props = {
  fullView?: boolean;
};

export function DocumentDetailsSkeleton({ fullView }: Props) {
  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      <SheetHeader className="mb-4 flex justify-between items-center flex-row">
        <div className="min-w-0 flex-1 max-w-[50%] flex flex-row gap-2 items-end">
          <Skeleton className="h-6 w-3/4" />
        </div>
      </SheetHeader>

      {/* Mimic ScrollArea and FileViewer */}
      <div className="h-full max-h-[763px] p-0 pb-8 overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Mimic Footer section */}
      <div className="pt-4 border-t border-border">
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />

        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      <div className="relative mt-8">
        <VaultRelatedFilesSkeleton />
      </div>
    </div>
  );
}
