import { useInvoiceParams } from "@/hooks/use-invoice-params";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { InvoiceDetails } from "../invoice-details";

type Props = {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  data?: NonNullable<RouterOutputs["invoice"]["get"]>[number];
};

export function InvoiceDetailsSheet({ setOpen, isOpen, data }: Props) {
  const { invoiceId } = useInvoiceParams();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent>
        <InvoiceDetails id={invoiceId} data={data} />
      </SheetContent>
    </Sheet>
  );
}
