import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { InvoiceDetails } from "../invoice-details";

export function InvoiceDetailsSheet() {
  const { invoiceId, type, setParams } = useInvoiceParams();

  const isOpen = Boolean(invoiceId && type === "details");

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ invoiceId: null, type: null })}
    >
      <SheetContent>
        <InvoiceDetails />
      </SheetContent>
    </Sheet>
  );
}
