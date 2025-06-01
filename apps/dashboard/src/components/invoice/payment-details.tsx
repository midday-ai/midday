"use client";

import { Editor } from "@/components/invoice/editor";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");
  const [editorContent, setEditorContent] = useState<
    JSONContent | null | undefined
  >(null);
  const [debouncedContent] = useDebounceValue(editorContent, 400);

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  useEffect(() => {
    if (debouncedContent !== null) {
      updateTemplateMutation.mutate({
        paymentDetails: debouncedContent
          ? JSON.stringify(debouncedContent)
          : null,
      });
    }
  }, [debouncedContent, updateTemplateMutation]);

  return (
    <div>
      <LabelInput
        name="template.paymentLabel"
        onSave={(value) => {
          updateTemplateMutation.mutate({ paymentLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="paymentDetails"
        render={({ field }) => (
          <Editor
            // NOTE: This is a workaround to get the new content to render
            key={id}
            initialContent={field.value}
            onChange={(content) => {
              field.onChange(content);
              setEditorContent(content);
            }}
            className="min-h-[78px]"
          />
        )}
      />
    </div>
  );
}
