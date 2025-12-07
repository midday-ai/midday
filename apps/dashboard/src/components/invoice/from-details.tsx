"use client";

import { Editor } from "@/components/invoice/editor";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function FromDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");
  const templateId = watch("templateId");

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplates.upsert.mutationOptions(),
  );

  return (
    <div>
      <LabelInput
        name="template.fromLabel"
        className="mb-2 block"
        onSave={(value) => {
          updateTemplateMutation.mutate({
            fromLabel: value,
            templateId,
          });
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
              updateTemplateMutation.mutate({
                fromDetails: content ? JSON.stringify(content) : null,
                templateId,
              });
            }}
            className="min-h-[90px] [&>div]:min-h-[90px]"
          />
        )}
      />
    </div>
  );
}
