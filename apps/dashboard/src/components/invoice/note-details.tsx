"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/invoice/editor";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function NoteDetails() {
  const { control, setValue, watch } = useFormContext();
  const id = watch("id");
  const content = watch("note_details");

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  // NOTE: This is a workaround to get the new content to render
  useEffect(() => {
    if (content) {
      setValue("note_details", content, { shouldValidate: true });
    }
  }, [id]);

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
        render={({ field }) => {
          return (
            <Editor
              initialContent={field.value}
              onChange={field.onChange}
              className="h-[78px]"
            />
          );
        }}
      />
    </div>
  );
}
