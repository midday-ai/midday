"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import React from "react";

export function InvoiceCreateSheet() {
  const { toast } = useToast();
  const { setParams, invoiceId } = useInvoiceParams();

  const isOpen = Boolean(invoiceId);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams({ invoiceId: null })}>
      <SheetContent style={{ maxWidth: 590 }}>
        <SheetHeader className="mb-8 flex justify-between items-center flex-row">
          <h2 className="text-xl">Invoice</h2>
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-28" hideScrollbar></ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
