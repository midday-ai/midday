import { Sheet, SheetContent } from "@midday/ui/sheet";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { CustomerDetails } from "../customer-details";

export function CustomerDetailsSheet() {
  const { customerId, details, setParams } = useCustomerParams();

  const isOpen = Boolean(customerId && details);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ customerId: null, details: null })}
    >
      <SheetContent style={{ maxWidth: 620 }} className="pb-4">
        <CustomerDetails />
      </SheetContent>
    </Sheet>
  );
}
