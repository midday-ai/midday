"use client";

import { updateInvoiceSettingsAction } from "@/actions/invoice/update-invoice-settings-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control } = useFormContext();

  const updateInvoiceSettings = useAction(updateInvoiceSettingsAction);

  return (
    <div>
      <LabelInput
        name="settings.payment_details_label"
        onSave={(value) => {
          updateInvoiceSettings.execute({
            payment_details_label: value,
          });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="settings.payment_details"
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
            }}
            onBlur={(content) => {
              updateInvoiceSettings.execute({
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
