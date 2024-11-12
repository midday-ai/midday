"use client";

import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { cn } from "@midday/ui/cn";
import { useFormContext, useWatch } from "react-hook-form";
import { Editor } from "./editor";

type Props = {
  name: keyof InvoiceFormValues;
};

export function EditBlock({ name }: Props) {
  const { control, setValue } = useFormContext<InvoiceFormValues>();
  const content = useWatch({
    control,
    name,
  });

  return (
    <div className="group">
      <Editor
        initialContent={content}
        onChange={(newContent) => setValue(name, newContent)}
        placeholder="Write something..."
        disablePlaceholder
        className={cn(
          "transition-opacity",
          content ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      />
    </div>
  );
}
