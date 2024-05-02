"use client";

import { InboxHeader } from "./inbox-header";
import { InboxStructure } from "./inbox-structure";

type Props = {
  forwardEmail?: string;
  inboxId?: string;
  ascending: boolean;
};

export function InboxViewSkeleton({ forwardEmail, inboxId, ascending }: Props) {
  return (
    <InboxStructure
      isLoading
      headerComponent={
        <InboxHeader
          inboxForwarding
          ascending={ascending}
          forwardEmail={forwardEmail ?? ""}
          inboxId={inboxId ?? ""}
        />
      }
    />
  );
}
