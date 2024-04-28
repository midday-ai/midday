"use client";

import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxHeader } from "./inbox-header";
import { InboxSkeleton } from "./inbox-list";
import { InboxStructure } from "./inbox-structure";

type Props = {
  forwardEmail?: string;
  inboxId?: string;
};

export function InboxViewSkeleton({ forwardEmail, inboxId }: Props) {
  return (
    <InboxStructure
      leftColumn={
        <>
          <InboxHeader
            forwardEmail={forwardEmail ?? ""}
            inboxId={inboxId ?? ""}
          />
          <InboxSkeleton numberOfItems={12} />
        </>
      }
      rightColumn={<InboxDetailsSkeleton />}
    />
  );
}
