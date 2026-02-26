import { useMerchantParams } from "@/hooks/use-merchant-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { MerchantDetails } from "../merchant-details";

export function MerchantDetailsSheet() {
  const { merchantId, details, setParams } = useMerchantParams();

  const isOpen = Boolean(merchantId && details);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ merchantId: null, details: null })}
    >
      <SheetContent style={{ maxWidth: 620 }} className="pb-4">
        <MerchantDetails />
      </SheetContent>
    </Sheet>
  );
}
