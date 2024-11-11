import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { cn } from "../utils";

type Props = {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
};

export function QuantityInput({
  value = 0,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  onChange,
  onBlur,
  onFocus,
  className,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [rawValue, setRawValue] = React.useState(String(value));

  const handleInput: React.ChangeEventHandler<HTMLInputElement> = ({
    currentTarget: el,
  }) => {
    const input = el.value;
    setRawValue(input);

    // Check if input can be parsed as a valid number
    const num = Number.parseFloat(input);
    if (!Number.isNaN(num) && min <= num && num <= max) {
      onChange?.(num);
    }
  };

  const handlePointerDown =
    (diff: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      const newVal = Math.min(Math.max(value + diff, min), max);
      onChange?.(newVal);
      setRawValue(String(newVal));
    };

  return (
    <div
      className={cn(
        "group flex items-stretch transition-[box-shadow] font-mono",
        className,
      )}
    >
      <button
        aria-label="Decrease"
        className="flex items-center pr-[.325em]"
        disabled={value <= min}
        onPointerDown={handlePointerDown(-1)}
        type="button"
        tabIndex={-1}
      >
        <Minus
          className="size-2"
          absoluteStrokeWidth
          strokeWidth={3.5}
          tabIndex={-1}
        />
      </button>
      <div className="relative grid items-center justify-items-center text-center">
        <input
          ref={inputRef}
          className="flex w-8 text-center transition-colors file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0 border-0 h-6 text-xs !bg-transparent border-b border-transparent focus:border-border [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          style={{ fontKerning: "none" }}
          type="number"
          min={min}
          max={max}
          autoComplete="off"
          step={0.1}
          value={rawValue}
          onInput={handleInput}
          onBlur={onBlur}
          onFocus={onFocus}
          inputMode="decimal"
        />
      </div>
      <button
        aria-label="Increase"
        className="flex items-center pl-[.325em]"
        disabled={value >= max}
        onPointerDown={handlePointerDown(1)}
        type="button"
        tabIndex={-1}
      >
        <Plus
          className="size-2"
          absoluteStrokeWidth
          strokeWidth={3.5}
          tabIndex={-1}
        />
      </button>
    </div>
  );
}
