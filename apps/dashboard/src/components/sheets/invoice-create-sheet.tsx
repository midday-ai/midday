"use client";

import type { InvoiceTemplate } from "@/actions/invoice/schema";
import { Form } from "@/components/invoice/form";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Sheet, SheetHeader } from "@midday/ui/sheet";
import React from "react";
import type { Customer } from "../invoice/customer-details";
import { FormContext } from "../invoice/form-context";
import { SettingsMenu } from "../invoice/settings-menu";
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
        <InvoiceSheetContent>
          <SheetHeader className="mb-6 flex justify-between items-center flex-row">
            <h2 className="text-xl">Invoice</h2>
            <SettingsMenu />
          </SheetHeader>

          <Form teamId={teamId} customers={customers} />
        </InvoiceSheetContent>
      </Sheet>
    </FormContext>
  );
}
