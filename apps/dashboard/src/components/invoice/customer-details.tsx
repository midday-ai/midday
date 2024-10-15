"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function CustomerDetails() {
  const { control } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div>
      <LabelInput
        name="template.customer_label"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            customer_label: value,
          });
        }}
      />
      <Controller
        name="customerDetails"
        control={control}
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={field.onChange}
            className="h-[115px]"
          />
        )}
      />
    </div>
  );
}
