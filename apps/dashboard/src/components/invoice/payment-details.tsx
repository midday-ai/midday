"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/invoice/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div>
      <LabelInput
        name="template.payment_label"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            payment_label: value,
          });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="payment_details"
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
            }}
            onBlur={(content) => {
              updateInvoiceTemplate.execute({
                payment_details: content,
              });
            }}
            className="h-[78px]"
          />
        )}
      />
    </div>
  );
}
