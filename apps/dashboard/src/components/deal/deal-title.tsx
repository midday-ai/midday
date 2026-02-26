"use client";

import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";

export function DealTitle() {
  const { watch } = useFormContext();
  const dealTitle = watch("template.title");
  const { updateTemplate } = useTemplateUpdate();

  return (
    <Input
      className="text-[21px] font-serif mb-2 w-fit min-w-[100px] !border-none"
      name="template.title"
      onBlur={() => {
        updateTemplate({ title: dealTitle });
      }}
    />
  );
}
