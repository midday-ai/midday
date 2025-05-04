"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet } from "@midday/ui/sheet";
import React from "react";
import { FormContext } from "../invoice/form-context";
import { InvoiceSheetContent } from "./invoice-sheet-content";

export function InvoiceCreateSheet() {
  const { setParams, type } = useInvoiceParams();
  const isOpen = Boolean(type === "create" || type === "edit");

  return (
    <FormContext>
      <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
        <InvoiceSheetContent />
      </Sheet>
    </FormContext>
  );
}
