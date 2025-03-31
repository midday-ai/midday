"use client";

import { useSliderWithInput } from "@/hooks/use-slider-with-input";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { CurrencyInput } from "@midday/ui/currency-input";
import { Label } from "@midday/ui/label";
import { Slider } from "@midday/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";

export function AmountRange() {
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  const trpc = useTRPC();

  const { data: items, isLoading } = useQuery(
    trpc.transactions.getAmountRange.queryOptions(),
  );

  const [amountRange, setAmountRange] = useQueryState(
    "amount_range",
    parseAsArrayOf(parseAsInteger),
  );

  const minValue = items?.length
    ? Math.min(...items.map((item) => item.amount))
    : 0;
  const maxValue = items?.length
    ? Math.max(...items.map((item) => item.amount))
    : 0;

  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    setValues,
  } = useSliderWithInput({
    minValue,
    maxValue,
    initialValue: amountRange || [minValue, maxValue],
  });

  useEffect(() => {
    if (minValue !== undefined && maxValue !== undefined) {
      setValues([minValue, maxValue]);
    }
  }, [minValue, maxValue, setValues]);

  if (isLoading) return null;

  const handleSliderValueChange = (values: number[]) => {
    handleSliderChange(values);
  };

  const countItemsInRange = (min: number, max: number) => {
    return (
      items?.filter((item) => item.amount >= min && item.amount <= max)
        .length ?? 0
    );
  };

  const totalCount = countItemsInRange(
    sliderValue[0] ?? minValue,
    sliderValue[1] ?? maxValue,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form
          className="flex w-full items-center justify-between gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (sliderValue[0] !== undefined && sliderValue[1] !== undefined) {
              setAmountRange([sliderValue[0], sliderValue[1]]);
            }
          }}
        >
          <div className="space-y-1 flex-1">
            <Label htmlFor="min-amount" className="text-xs">
              Min amount
            </Label>

            <CurrencyInput
              className="w-full font-mono text-xs"
              type="text"
              inputMode="decimal"
              value={inputValues[0] || ""}
              onChange={(e) => handleInputChange(e, 0)}
              onFocus={(e) => e.target.select()}
              onBlur={() => validateAndUpdateValue(inputValues[0] ?? "", 0)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  validateAndUpdateValue(inputValues[0] ?? "", 0);
                  maxInputRef.current?.focus();
                }
              }}
              aria-label="Enter minimum amount"
              getInputRef={minInputRef}
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label htmlFor="max-amount" className="text-xs">
              Max amount
            </Label>

            <CurrencyInput
              className="w-full font-mono text-xs"
              type="text"
              inputMode="decimal"
              value={inputValues[1] || ""}
              onChange={(e) => handleInputChange(e, 1)}
              onFocus={(e) => e.target.select()}
              onBlur={() => validateAndUpdateValue(inputValues[1] ?? "", 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  validateAndUpdateValue(inputValues[1] ?? "", 1);
                }
              }}
              aria-label="Enter maximum amount"
              getInputRef={maxInputRef}
            />
          </div>
        </form>
      </div>

      <Slider
        value={sliderValue}
        onValueChange={handleSliderValueChange}
        min={minValue}
        max={maxValue}
        aria-label="Amount range"
      />

      <Button
        className="w-full text-xs"
        variant="outline"
        disabled={totalCount === 0}
        onClick={() => {
          if (sliderValue[0] !== undefined && sliderValue[1] !== undefined) {
            setAmountRange([sliderValue[0], sliderValue[1]], {
              shallow: false,
            });
          }
        }}
      >
        {totalCount === 0
          ? "No transactions"
          : `Show ${totalCount} transactions`}
      </Button>
    </div>
  );
}
