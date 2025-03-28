"use client";

import { useTransactionParams } from "@/hooks/use-transaction-params";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TransactionDetails } from "../transaction-details";

export function TransactionSheet() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { transactionId, setTransactionId } = useTransactionParams();
  const isOpen = Boolean(transactionId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTransactionId(null);
    }
  };

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent>
          <TransactionDetails />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="p-6">
        <TransactionDetails />
      </DrawerContent>
    </Drawer>
  );
}
