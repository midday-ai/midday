"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/invoice/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function NoteDetails() {
  const { control } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div>
      <LabelInput
        name="template.note_label"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            note_label: value,
          });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="note_details"
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
            }}
            className="h-[78px]"
          />
        )}
      />
    </div>
  );
}
