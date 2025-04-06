import { useInvoiceParams } from "@/hooks/use-invoice-params";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { InvoiceDetails } from "../invoice-details";

type Props = {
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  data?: NonNullable<RouterOutputs["invoice"]["get"]>[number];
};

export function InvoiceDetailsSheet({ setOpen, isOpen, data }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { invoiceId } = useInvoiceParams();

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent>
          <InvoiceDetails id={invoiceId} data={data} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpen(undefined);
        }
      }}
    >
      <DrawerContent className="p-6">
        <InvoiceDetails id={invoiceId} data={data} />
      </DrawerContent>
    </Drawer>
  );
}
