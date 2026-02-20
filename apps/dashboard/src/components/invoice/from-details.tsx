"use client";

import { Controller, useFormContext } from "react-hook-form";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { LabelInput } from "./label-input";

export function FromDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");
  const templateId = watch("template.id");
  const { updateTemplate } = useTemplateUpdate();

  return (
    <div>
      <LabelInput
        name="template.fromLabel"
        className="mb-2 block"
        onSave={(value) => {
          updateTemplate({ fromLabel: value });
        }}
      />

      <Controller
        name="fromDetails"
        control={control}
        render={({ field }) => (
          <InvoiceEditor
            // NOTE: Key includes both invoice ID and template ID to force remount
            // when either changes, preventing stale content from being saved
            key={`${id}-${templateId}`}
            initialContent={field.value}
            onChange={field.onChange}
            onBlur={(content) => {
              updateTemplate({
                fromDetails: content ? JSON.stringify(content) : null,
              });
            }}
            className="min-h-[90px] [&>div]:min-h-[90px]"
            placeholder="Type / to insert details"
          />
        )}
      />
    </div>
  );
}
