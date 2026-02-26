"use client";

import { cn } from "@midday/ui/cn";
import { useFormContext } from "react-hook-form";

type Props = {
  name: string;
  required?: boolean;
  className?: string;
  onSave?: (value: string) => void;
  defaultValue?: string;
};

export function LabelInput({ name, className, onSave, defaultValue }: Props) {
  const { setValue, watch } = useFormContext();
  const value = watch(name);
  const displayValue = value ?? defaultValue ?? "";

  return (
    <span
      className={cn(
        "text-[11px] text-[#878787] min-w-10 outline-none",
        className,
      )}
      id={name}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const newValue = e.currentTarget.textContent || "";

        // Only call onSave if the value has changed from what was displayed
        if (newValue !== displayValue) {
          setValue(name, newValue, { shouldValidate: true, shouldDirty: true });
          onSave?.(newValue);
        }
      }}
    >
      {displayValue}
    </span>
  );
}
