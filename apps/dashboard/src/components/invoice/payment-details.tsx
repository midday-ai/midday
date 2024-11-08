"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/invoice/editor";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, setValue, watch } = useFormContext();
  const id = watch("id");

  const content = watch("payment_details");

  // NOTE: This is a workaround to get the new content to render
  useEffect(() => {
    if (content) {
      setValue("payment_details", content, { shouldValidate: true });
    }
  }, [id]);

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
            onChange={field.onChange}
            onBlur={(content) => {
              updateInvoiceTemplate.execute({
                payment_details: content ? JSON.stringify(content) : null,
              });
            }}
            className="h-[78px]"
          />
        )}
      />
    </div>
  );
}
