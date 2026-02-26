import { useDealParams } from "@/hooks/use-deal-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { DealDetails } from "../deal-details";

export function DealDetailsSheet() {
  const { dealId, type, setParams } = useDealParams();

  const isOpen = Boolean(dealId && type === "details");

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ dealId: null, type: null })}
    >
      <SheetContent>
        <DealDetails />
      </SheetContent>
    </Sheet>
  );
}
