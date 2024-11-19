"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { useAction } from "next-safe-action/hooks";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";

export function InvoiceTitle() {
  const { watch } = useFormContext();
  const invoiceTitle = watch("template.title");

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <Input
      className="text-[21px] font-medium mb-2 w-fit min-w-[100px] !border-none"
      name="template.title"
      onBlur={() => {
        updateInvoiceTemplate.execute({ title: invoiceTitle });
      }}
    />
  );
}
