import { cn } from "@midday/ui/cn";
import { CurrencyInput } from "@midday/ui/currency-input";
import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import type { NumericFormatProps } from "react-number-format";

export function AmountInput({
  className,
  name,
  ...props
}: Omit<NumericFormatProps, "value" | "onChange"> & {
  name: string;
}) {
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
    <div className="relative font-mono">
      <CurrencyInput
        autoComplete="off"
        value={value}
        onValueChange={(values) => {
          onChange(values.floatValue, { shouldValidate: true });
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
        {...props}
        className={cn(
          className,
          isPlaceholder && "opacity-0",
          "p-0 border-0 h-6 text-xs !bg-transparent border-b border-transparent focus:border-border",
        )}
        thousandSeparator={true}
      />

      {isPlaceholder && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        </div>
      )}
    </div>
  );
}
