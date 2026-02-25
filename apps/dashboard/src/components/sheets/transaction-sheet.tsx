"use client";

import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { TransactionDetails } from "../transaction-details";

export function TransactionSheet() {
  const { transactionId, setParams } = useTransactionParams();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOpen = Boolean(transactionId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams(null);
    }
  };

  if (!isDesktop) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex flex-col max-h-[92vh] rounded-none [&>div:first-child]:h-1 [&>div:first-child]:w-12 [&>div:first-child]:rounded-none [&>div:first-child]:mt-2 [&>div:first-child]:mb-4">
          <div className="flex-1 overflow-y-auto px-4 pb-24 min-h-0">
            <TransactionDetails />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <TransactionDetails />
      </SheetContent>
    </Sheet>
  );
}
