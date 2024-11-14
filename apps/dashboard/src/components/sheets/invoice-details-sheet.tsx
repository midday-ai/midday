import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Drawer, DrawerContent } from "@midday/ui/drawer";
import { useMediaQuery } from "@midday/ui/hooks";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { InvoiceDetails } from "../invoice-details";
import type { Invoice } from "../tables/invoices/columns";

type Props = {
  setOpen: (id?: string) => void;
  isOpen: boolean;
  data?: Invoice;
  locale: string;
};

export function InvoiceDetailsSheet({ setOpen, isOpen, data, locale }: Props) {
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
