"use client";

import { useTransactionParams } from "@/hooks/use-transaction-params";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { TransactionCreateForm } from "../forms/transaction-create-form";

export function TransactionCreateSheet() {
  const { createTransaction, setParams } = useTransactionParams();

  const isOpen = Boolean(createTransaction);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader className="mb-8">
          <SheetTitle>Create Transaction</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-[100px]" hideScrollbar>
          <TransactionCreateForm />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
