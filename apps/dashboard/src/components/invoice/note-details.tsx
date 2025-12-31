"use client";

import { Editor } from "@/components/invoice/editor";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function NoteDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");
  const { updateTemplate } = useTemplateUpdate();

  return (
    <div>
      <LabelInput
        name="template.noteLabel"
        onSave={(value) => {
          updateTemplate({ noteLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="noteDetails"
        render={({ field }) => {
          return (
            <Editor
              // NOTE: This is a workaround to get the new content to render
              key={id}
              initialContent={field.value}
              onChange={field.onChange}
              onBlur={(content) => {
                updateTemplate({
                  noteDetails: content ? JSON.stringify(content) : null,
                });
              }}
              className="min-h-[78px]"
            />
          );
        }}
      />
    </div>
  );
}
