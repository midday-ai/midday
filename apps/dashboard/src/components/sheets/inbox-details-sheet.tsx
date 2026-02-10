"use client";

import { Sheet, SheetContent } from "@midday/ui/sheet";
import { InboxSheetDetails } from "@/components/inbox-sheet-details";
import { useInboxParams } from "@/hooks/use-inbox-params";

export function InboxDetailsSheet() {
  const { params, setParams } = useInboxParams();

  const isOpen = Boolean(params.inboxId && params.type === "details");

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ type: null, inboxId: null })}
    >
      <SheetContent style={{ maxWidth: 647 }}>
        <InboxSheetDetails />
      </SheetContent>
    </Sheet>
  );
}
