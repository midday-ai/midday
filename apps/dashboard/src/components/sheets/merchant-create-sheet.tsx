"use client";

import { useMerchantParams } from "@/hooks/use-merchant-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React from "react";
import { MerchantForm } from "../forms/merchant-form";

export function MerchantCreateSheet() {
  const { setParams, createMerchant } = useMerchantParams();

  const isOpen = Boolean(createMerchant);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Add Merchant</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setParams(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <MerchantForm />
      </SheetContent>
    </Sheet>
  );
}
