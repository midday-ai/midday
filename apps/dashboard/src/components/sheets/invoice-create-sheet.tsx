"use client";

import type { InvoiceTemplate } from "@/actions/invoice/schema";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet } from "@midday/ui/sheet";
import React from "react";
import type { Customer } from "../invoice/customer-details";
import { FormContext } from "../invoice/form-context";
import { InvoiceSheetContent } from "./invoice-sheet-content";

type Props = {
  teamId: string;
  template: InvoiceTemplate;
  customers: Customer[];
  invoiceNumber: string;
};

export function InvoiceCreateSheet({
  teamId,
  template,
  customers,
  invoiceNumber,
}: Props) {
  const { setParams, type, invoiceId } = useInvoiceParams();
  const isOpen = Boolean(type === "create" || type === "edit");

  return (
    <FormContext
      template={template}
      invoiceNumber={invoiceNumber}
      isOpen={isOpen}
      id={invoiceId}
    >
      <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
        <InvoiceSheetContent teamId={teamId} customers={customers} />
      </Sheet>
    </FormContext>
  );
}
