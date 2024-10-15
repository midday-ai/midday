"use client";

import { updateInvoiceSettingsAction } from "@/actions/invoice/update-invoice-settings-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import type { JSONContent } from "novel";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function FromDetails() {
  const { control } = useFormContext();

  const updateInvoiceSettings = useAction(updateInvoiceSettingsAction);

  return (
    <div>
      <LabelInput
        name="settings.from_label"
        onSave={(value) => {
          updateInvoiceSettings.execute({
            from_label: value,
          });
        }}
      />
      <Controller
        name="settings.from_details"
        control={control}
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
            }}
            onBlur={(content) => {
              updateInvoiceSettings.execute({
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
