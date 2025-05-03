"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet } from "@midday/ui/sheet";
import React from "react";
import { FormContext } from "../invoice/form-context";
import { InvoiceSheetContent } from "./invoice-sheet-content";

export function InvoiceCreateSheet() {
  return null;
  const { setParams, type, invoiceId } = useInvoiceParams();
  const isOpen = Boolean(type === "create" || type === "edit");

  return (
    <FormContext
      template={template}
      invoiceNumber={invoiceNumber}
      isOpen={isOpen}
      id={invoiceId}
      defaultSettings={defaultSettings}
    >
      <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
        <InvoiceSheetContent
          teamId={teamId}
          customers={customers}
          invoiceNumber={invoiceNumber}
        />
      </Sheet>
    </FormContext>
  );
}
