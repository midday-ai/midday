"use client";

import { useTransactionParams } from "@/hooks/use-transaction-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { TransactionDetails } from "../transaction-details";

export function TransactionSheet() {
  const { transactionId, setTransactionId } = useTransactionParams();
  const isOpen = Boolean(transactionId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTransactionId(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <TransactionDetails />
      </SheetContent>
    </Sheet>
  );
}
