"use client";

import { Separator } from "@midday/ui/separator";
import { Skeleton } from "@midday/ui/skeleton";

export function InboxDetailsSkeleton() {
  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden flex-col border w-[595px] hidden md:flex shrink-0 -mt-[54px]">
      <div className="flex items-center p-2 h-[52px] w-full" />

      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Skeleton className="h-[40px] w-[40px] rounded-full" />
            <div className="grid gap-1 space-y-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[50px]" />
            </div>
          </div>
          <div className="grid gap-1 ml-auto text-right">
            <Skeleton className="h-3 w-[70px] ml-auto" />
          </div>
        </div>
        <Separator />
        <div className="relative h-full p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
