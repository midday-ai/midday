"use client";

import { cn } from "@midday/ui/cn";
import { Controller, useFormContext } from "react-hook-form";
import { Editor } from "./editor";
import type { InvoiceFormValues } from "./form-context";

type Props = {
  name: keyof InvoiceFormValues;
};

export function EditBlock({ name }: Props) {
  const { control, watch } = useFormContext();
  const id = watch("id");

  return (
    <div className="group">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Editor
            // NOTE: This is a workaround to get the new content to render
            key={id}
            tabIndex={-1}
            initialContent={field.value}
            onChange={field.onChange}
            placeholder="Write something..."
            disablePlaceholder
            className={cn(
              "transition-opacity",
              field.value ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          />
        )}
      />
    </div>
  );
}
