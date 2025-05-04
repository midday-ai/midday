import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { InvoiceDetails } from "../invoice-details";

export function InvoiceDetailsSheet() {
  const { invoiceId, setParams } = useInvoiceParams();

  const isOpen = Boolean(invoiceId);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams({ invoiceId: null })}>
      <SheetContent>
        <InvoiceDetails />
      </SheetContent>
    </Sheet>
  );
}
