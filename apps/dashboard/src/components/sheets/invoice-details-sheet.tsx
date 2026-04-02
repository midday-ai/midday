import { Sheet, SheetContent } from "@midday/ui/sheet";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { InvoiceDetails } from "../invoice-details";

export function InvoiceDetailsSheet() {
  const { invoiceId, invoiceType, setParams } = useInvoiceParams();

  const isOpen = Boolean(invoiceId && invoiceType === "details");

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ invoiceId: null, invoiceType: null })}
    >
      <SheetContent>
        <InvoiceDetails />
      </SheetContent>
    </Sheet>
  );
}
