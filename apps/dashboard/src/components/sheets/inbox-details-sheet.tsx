"use client";

import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import { InboxSheetDetails } from "@/components/inbox-sheet-details";
import { useInboxParams } from "@/hooks/use-inbox-params";

export function InboxDetailsSheet() {
  const { params, setParams } = useInboxParams();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const isOpen = Boolean(
    params.inboxId && (params.type === "details" || !isDesktop),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams({ type: null, inboxId: null });
    }
  };

  if (!isDesktop) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex flex-col h-[92vh] overflow-hidden rounded-none [&>div:first-child]:h-1 [&>div:first-child]:w-12 [&>div:first-child]:rounded-none [&>div:first-child]:mt-2 [&>div:first-child]:mb-4">
          <div className="flex-1 min-h-0 flex flex-col px-4 overflow-hidden">
            <InboxSheetDetails stickyFooter />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent style={{ maxWidth: 647 }}>
        <InboxSheetDetails />
      </SheetContent>
    </Sheet>
  );
}
