"use client";

import { useDealParams } from "@/hooks/use-deal-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { DealForm } from "../forms/deal-form";

export function DealCreateSheet() {
  const { setParams, createDeal } = useDealParams();

  const isOpen = Boolean(createDeal);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Create Deal</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setParams(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <DealForm />
      </SheetContent>
    </Sheet>
  );
}
