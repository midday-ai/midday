"use client";

import { cn } from "@midday/ui/cn";
import { useFormContext } from "react-hook-form";

type Props = {
  name: string;
  required?: boolean;
  className?: string;
};

export function LabelInput({ name, className }: Props) {
  const { setValue, watch } = useFormContext();
  const value = watch(name);

  return (
    <span
      className={cn("text-[11px] text-[#878787] font-mono", className)}
      id={name}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const newValue = e.currentTarget.textContent || "";
        setValue(name, newValue, { shouldValidate: true });
      }}
    >
      {value}
    </span>
  );
}
