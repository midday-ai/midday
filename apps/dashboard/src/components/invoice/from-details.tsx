"use client";

import { Editor } from "@/components/invoice/editor";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function FromDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");
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
          <Editor
            // NOTE: This is a workaround to get the new content to render
            key={id}
            initialContent={field.value}
            onChange={field.onChange}
            onBlur={(content) => {
              updateTemplate({
                fromDetails: content ? JSON.stringify(content) : null,
              });
            }}
            className="min-h-[90px] [&>div]:min-h-[90px]"
          />
        )}
      />
    </div>
  );
}
