"use client";

import { Editor } from "@/components/invoice/editor";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function NoteDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  return (
    <div>
      <LabelInput
        name="template.noteLabel"
        onSave={(value) => {
          updateTemplateMutation.mutate({ noteLabel: value });
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
              className="min-h-[78px]"
            />
          );
        }}
      />
    </div>
  );
}
