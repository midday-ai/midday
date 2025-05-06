"use client";

import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxListSkeleton } from "./inbox-list-skeleton";

export function InboxViewSkeleton() {
  return (
    <div className="flex flex-row space-x-8 mt-4">
      <div className="w-full h-full">
        <InboxListSkeleton numberOfItems={10} />
      </div>

      <InboxDetailsSkeleton />
    </div>
  );
}
