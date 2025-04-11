"use client";

import { Separator } from "@midday/ui/separator";
import { Skeleton } from "@midday/ui/skeleton";

export function InboxDetailsSkeleton() {
  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden flex-col border w-[1160px] hidden md:flex">
      <div className="flex items-center py-2 h-[52px]">
        <div className="flex items-center gap-2" />
      </div>

      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Skeleton className="h-[40px] w-[40px] rounded-full" />
            <div className="grid gap-1 space-y-1">
              <Skeleton className="h-3 w-[100px]" />
              <Skeleton className="h-2 w-[120px]" />
            </div>
          </div>
          <div className="grid gap-1 ml-auto text-right">
            <Skeleton className="h-2 w-[100px] ml-auto" />
            <Skeleton className="h-2 w-[50px] ml-auto" />
          </div>
        </div>

        <Separator />
      </div>
    </div>
  );
}
