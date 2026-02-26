"use client";

import { cn } from "@midday/ui/cn";
import { CurrencyInput } from "@midday/ui/currency-input";
import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";

type Props = {
  name: string;
  className?: string;
  min?: number;
  max?: number;
};

export function PercentInput({ name, className, min = 0, max = 100 }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const { control } = useFormContext();
  const {
    field: { value, onChange, onBlur },
  } = useController({
    name,
    control,
  });

  const isPlaceholder = (value === undefined || value === null) && !isFocused;

  return (
    <div className="relative font-mono">
      <CurrencyInput
        autoComplete="off"
        value={value}
        onValueChange={(values) => {
          onChange(
            values.floatValue !== undefined && values.floatValue !== null
              ? values.floatValue
              : 0,
            { shouldValidate: true },
          );
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
        isAllowed={(values) => {
          const { floatValue } = values;
          if (floatValue === undefined) return true;
          return floatValue >= min && floatValue <= max;
        }}
        suffix="%"
        decimalScale={2}
        thousandSeparator={false}
        className={cn(
          "p-0 border-0 h-6 text-xs !bg-transparent border-b border-transparent focus:border-border text-left",
          isPlaceholder && "opacity-0",
          className,
        )}
      />

      {isPlaceholder && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        </div>
      )}
    </div>
  );
}
