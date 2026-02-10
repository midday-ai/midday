"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");
  const templateId = watch("template.id");
  const { updateTemplate } = useTemplateUpdate();

  return (
    <div>
      <LabelInput
        name="template.paymentLabel"
        onSave={(value) => {
          updateTemplate({ paymentLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="paymentDetails"
        render={({ field }) => (
          <InvoiceEditor
            // NOTE: Key includes both invoice ID and template ID to force remount
            // when either changes, preventing stale content from being saved
            key={`${id}-${templateId}`}
            initialContent={field.value}
            onChange={field.onChange}
            onBlur={(content) => {
              updateTemplate({
                paymentDetails: content ? JSON.stringify(content) : null,
              });
            }}
            className="min-h-[78px]"
            placeholder="Type / to insert details"
          />
        )}
      />
    </div>
  );
}
