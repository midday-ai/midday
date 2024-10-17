"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function FromDetails() {
  const { control } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div>
      <LabelInput
        name="template.from_label"
        className="mb-2 block"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            from_label: value,
          });
        }}
      />
      <Controller
        name="template.from_details"
        control={control}
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
            }}
            onBlur={(content) => {
              updateInvoiceTemplate.execute({
                from_details: content,
              });
            }}
            className="h-[115px]"
          />
        )}
      />
    </div>
  );
}
