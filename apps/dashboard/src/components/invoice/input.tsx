import { cn } from "@midday/ui/cn";
import { Input as BaseInput, type InputProps } from "@midday/ui/input";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

export function Input({ className, ...props }: InputProps) {
  const { register, watch } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const fieldName = props.name as string;
  const fieldValue = watch(fieldName);

  const { ref, ...rest } = register(fieldName);

  return (
    <div className="relative">
      <BaseInput
        {...props}
        {...rest}
        ref={ref}
        autoComplete="off"
        value={fieldValue || ""}
        className={cn(
          "border-0 p-0 h-6 text-sm border-b border-transparent focus:border-border",
          className,
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {!fieldValue && !isFocused && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]" />
        </div>
      )}
    </div>
  );
}
