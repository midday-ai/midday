import { cn } from "@midday/ui/cn";
import { CurrencyInput } from "@midday/ui/currency-input";
import { useState } from "react";
import type { NumericFormatProps } from "react-number-format";

export function AmountInput({
  className,
  value,
  onValueChange,
  ...props
}: Omit<NumericFormatProps, "value"> & {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <CurrencyInput
        prefix="$"
        autoComplete="off"
        value={value}
        onValueChange={(values) => {
          onValueChange?.(values.floatValue);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
        className={cn(
          className,
          "p-0 border-0 h-8 text-xs !bg-transparent border-b border-transparent focus:border-border",
        )}
        thousandSeparator={true}
        allowNegative={false}
      />
      {!value && !isFocused && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]" />
        </div>
      )}
    </div>
  );
}
