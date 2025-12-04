import { useCustomerParams } from "@/hooks/use-customer-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { CustomerDetails } from "../customer-details";

export function CustomerDetailsSheet() {
  const { customerId, type, setParams } = useCustomerParams();

  const isOpen = Boolean(customerId && type === "details");

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ customerId: null, type: null })}
    >
      <SheetContent style={{ maxWidth: 620 }} className="pb-4">
        <CustomerDetails />
      </SheetContent>
    </Sheet>
  );
}
