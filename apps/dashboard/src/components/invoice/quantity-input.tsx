import { cn } from "@midday/ui/cn";
import { QuantityInput as BaseQuantityInput } from "@midday/ui/quantity-input";
import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";

export function QuantityInput({
  name,
  ...props
}: { name: string } & Omit<Parameters<typeof BaseQuantityInput>[0], "value">) {
  const [isFocused, setIsFocused] = useState(false);

  const { control } = useFormContext();
  const {
    field: { value, onChange, onBlur },
  } = useController({
    name,
    control,
  });

  const isPlaceholder = !value && !isFocused;

  return (
    <div className="relative">
      <BaseQuantityInput
        {...props}
        value={value}
        min={0}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        className={cn(
          isPlaceholder && "opacity-0 [&_button]:pointer-events-none",
        )}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
      />

      {isPlaceholder && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        </div>
      )}
    </div>
  );
}
