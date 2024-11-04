// import NumberFlow from "@number-flow/react";
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
};

export function QuantityInput({
  value = 0,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  onChange,
  onBlur,
  onFocus,
}: Props) {
  const defaultValue = React.useRef(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [animated, setAnimated] = React.useState(true);

  // Hide the caret during transitions so you can't see it shifting around:
  const [showCaret, setShowCaret] = React.useState(true);
  const handleInput: React.ChangeEventHandler<HTMLInputElement> = ({
    currentTarget: el,
  }) => {
    setAnimated(false);
    let next = value;
    if (el.value === "") {
      next = defaultValue.current;
    } else {
      const num = Number.parseInt(el.value);
      if (!Number.isNaN(num) && min <= num && num <= max) next = num;
    }
    // Manually update the input.value in case the number stays the same e.g. 09 == 9
    el.value = String(next);
    onChange?.(next);
  };

  const handlePointerDown =
    (diff: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
      setAnimated(true);
      if (event.pointerType === "mouse") {
        event?.preventDefault();
        inputRef.current?.focus();
      }
      const newVal = Math.min(Math.max(value + diff, min), max);
      onChange?.(newVal);
    };

  return (
    <div className="group flex items-stretch transition-[box-shadow] font-mono">
      <button
        aria-label="Decrease"
        className="flex items-center pr-[.325em]"
        disabled={min != null && value <= min}
        onPointerDown={handlePointerDown(-1)}
        type="button"
        tabIndex={-1}
      >
        <Minus className="size-2" absoluteStrokeWidth strokeWidth={3.5} />
      </button>
      <div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
        <input
          ref={inputRef}
          className={cn(
            showCaret ? "caret-primary" : "caret-transparent",
            "font-mono spin-hide w-[1.5em] bg-transparent text-center text-transparent outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          )}
          // Make sure to disable kerning, to match NumberFlow:
          style={{ fontKerning: "none" }}
          type="number"
          min={min}
          step={1}
          autoComplete="off"
          inputMode="numeric"
          max={max}
          value={value}
          onInput={handleInput}
          onBlur={onBlur}
          onFocus={onFocus}
        />
        <span className="text-xs">{value}</span>
        {/* NOTE: Tabbing from this element is not possible right now */}
        {/* <NumberFlow
          value={value}
          format={{ useGrouping: false }}
          animated={animated}
          onAnimationsStart={() => setShowCaret(false)}
          onAnimationsFinish={() => setShowCaret(true)}
          className="text-xs"
          willChange
        /> */}
      </div>
      <button
        aria-label="Increase"
        className="flex items-center pl-[.325em]"
        disabled={max != null && value >= max}
        onPointerDown={handlePointerDown(1)}
        type="button"
        tabIndex={-1}
      >
        <Plus className="size-2" absoluteStrokeWidth strokeWidth={3.5} />
      </button>
    </div>
  );
}
