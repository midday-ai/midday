"use client";

import { updateInvoiceSettingsAction } from "@/actions/invoice/update-invoice-settings-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function CustomerContent() {
  const { control } = useFormContext();

  const updateInvoiceSettings = useAction(updateInvoiceSettingsAction);

  return (
    <div>
      <LabelInput
        name="settings.customer_label"
        onSave={(value) => {
          updateInvoiceSettings.execute({
            customer_label: value,
          });
        }}
      />
      <Controller
        name="customerContent"
        control={control}
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            placeholder="Search or create a customer"
            onChange={field.onChange}
            className="h-[115px]"
          />
        )}
      />
    </div>
  );
}
