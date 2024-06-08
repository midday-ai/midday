"use client";

import { InboxHeader } from "./inbox-header";
import { InboxStructure } from "./inbox-structure";

export function InboxViewSkeleton() {
  return (
    <InboxStructure
      isLoading
      headerComponent={
        <InboxHeader forwardEmail="" inboxId="" ascending inboxForwarding />
      }
    />
  );
}
