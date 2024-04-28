"use client";

import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxHeader } from "./inbox-header";
import { InboxListSkeleton } from "./inbox-list-skeleton";
import { InboxStructure } from "./inbox-structure";

export function InboxViewSkeleton() {
  return (
    <InboxStructure
      leftColumn={
        <>
          <InboxHeader forwardEmail="" inboxId="" />
          <InboxListSkeleton numberOfItems={12} />
        </>
      }
      rightColumn={<InboxDetailsSkeleton />}
    />
  );
}
