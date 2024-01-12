"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TransactionDetails } from "../transaction-details";

export function TransactionSheet({ setOpen, isOpen, data, transactionId }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent>
          <TransactionDetails transactionId={transactionId} data={data} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpen(false);
        }
      }}
    >
      <DrawerContent className="p-6">
        <TransactionDetails transactionId={transactionId} data={data} />
      </DrawerContent>
    </Drawer>
  );
}
