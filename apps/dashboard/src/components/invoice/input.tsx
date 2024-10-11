import { cn } from "@midday/ui/cn";
import { Input as BaseInput, type InputProps } from "@midday/ui/input";
import { useEffect, useState } from "react";

export function Input({ className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(props.value || "");

  useEffect(() => {
    setInternalValue(props.value || "");
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className="relative">
      <BaseInput
        {...props}
        autoComplete="off"
        value={internalValue}
        onChange={handleChange}
        className={cn(
          "border-0 p-0 h-8 text-sm border-b border-transparent focus:border-border",
          className,
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {!internalValue && !isFocused && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]" />
        </div>
      )}
    </div>
  );
}
