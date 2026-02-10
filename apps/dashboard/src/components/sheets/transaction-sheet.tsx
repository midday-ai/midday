"use client";

import { Sheet, SheetContent } from "@midday/ui/sheet";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { TransactionDetails } from "../transaction-details";

export function TransactionSheet() {
  const { transactionId, setParams } = useTransactionParams();
  const isOpen = Boolean(transactionId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams(null);
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
