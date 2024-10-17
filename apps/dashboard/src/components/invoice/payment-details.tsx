"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, watch } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const dueDate = watch("due_date");
  const invoiceNumber = watch("invoice_number");

  return (
    <div>
      <LabelInput
        name="template.payment_details_label"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            payment_details_label: value,
          });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="template.payment_details"
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
            context={{
              "Due date": "10/31/2024",
              "Invoice number": "INV-0001",
            }}
          />
        )}
      />
    </div>
  );
}
