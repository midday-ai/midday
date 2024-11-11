"use    client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { useAction } from "next-safe-action/hooks";
import { ContentEditable } from "./content-editable";

export function InvoiceTitle() {
  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <ContentEditable
      className="text-[21px] font-medium mb-1 w-fit min-w-[100px]"
      name="template.title"
      onBlur={(e) => {
        const value = e.currentTarget.textContent || undefined;

        updateInvoiceTemplate.execute({ title: value });
      }}
    />
  );
}
