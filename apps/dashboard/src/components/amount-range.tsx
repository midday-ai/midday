"use client";

import { useSliderWithInput } from "@/hooks/use-slider-with-input";
import { useUserContext } from "@/store/user/hook";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Slider } from "@midday/ui/slider";
import { parseAsArrayOf, parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  amount: number;
};

export function AmountRange() {
  const [items, setItems] = useState<Item[]>([]);
  const tick_count = 40;
  const supabase = createClient();
  const { team_id } = useUserContext((state) => state.data);

  const minValue =
    items.length > 0 ? Math.min(...items.map((item) => item.amount)) : 0;
  const maxValue =
    items.length > 0 ? Math.max(...items.map((item) => item.amount)) : 0;

  const [amountRange, setAmountRange] = useQueryState(
    "amount_range",
    parseAsArrayOf(parseAsInteger),
  );

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
    initialValue: amountRange || [],
  });

  const amountStep = (maxValue - minValue) / tick_count;

  const itemCounts = Array(tick_count)
    .fill(0)
    .map((_, tick) => {
      const rangeMin = minValue + tick * amountStep;
      const rangeMax = minValue + (tick + 1) * amountStep;
      return items.filter(
        (item) => item.amount >= rangeMin && item.amount < rangeMax,
      ).length;
    });

  const maxCount = Math.max(...itemCounts);

  const handleSliderValueChange = (values: number[]) => {
    handleSliderChange(values);
  };

  const countItemsInRange = (min: number, max: number) => {
    return items.filter((item) => item.amount >= min && item.amount <= max)
      .length;
  };

  const isBarInSelectedRange = (
    index: number,
    minValue: number,
    amountStep: number,
    sliderValue: number[],
  ) => {
    const rangeMin = minValue + index * amountStep;
    const rangeMax = minValue + (index + 1) * amountStep;
    return (
      countItemsInRange(sliderValue[0], sliderValue[1]) > 0 &&
      rangeMin <= sliderValue[1] &&
      rangeMax >= sliderValue[0]
    );
  };

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .rpc("get_transactions_amount_range_data", {
          team_id,
        })
        .select("*");

      setItems(data);
    }

    if (!items.length) {
      fetchItems();
    }
  }, []);

  useEffect(() => {
    setValues([minValue, maxValue]);
  }, [minValue, maxValue]);

  const totalCount = countItemsInRange(
    sliderValue[0] ?? minValue,
    sliderValue[1] ?? maxValue,
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex h-12 w-full items-end px-3" aria-hidden="true">
          {itemCounts.map((count, i) => (
            <div
              key={`histogram-bar-${i.toString()}`}
              className="flex flex-1 justify-center"
              style={{
                height: `${(count / maxCount) * 100}%`,
              }}
            >
              <span
                data-selected={isBarInSelectedRange(
                  i,
                  minValue,
                  amountStep,
                  sliderValue,
                )}
                className="h-full w-full bg-primary/20"
              />
            </div>
          ))}
        </div>
        <Slider
          value={sliderValue}
          onValueChange={handleSliderValueChange}
          min={minValue}
          max={maxValue}
          aria-label="Amount range"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="min-amount" className="text-xs">
            Min amount
          </Label>

          <Input
            id="min-amount"
            className="w-full font-mono text-xs"
            type="text"
            inputMode="decimal"
            value={inputValues[0]}
            onChange={(e) => handleInputChange(e, 0)}
            onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                validateAndUpdateValue(inputValues[0], 0);
              }
            }}
            aria-label="Enter minimum amount"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="max-amount" className="text-xs">
            Max amount
          </Label>

          <Input
            id="max-amount"
            className="w-full font-mono text-xs"
            type="text"
            inputMode="decimal"
            value={inputValues[1]}
            onChange={(e) => handleInputChange(e, 1)}
            onBlur={() => validateAndUpdateValue(inputValues[1], 1)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                validateAndUpdateValue(inputValues[1], 1);
              }
            }}
            aria-label="Enter maximum amount"
          />
        </div>
      </div>

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
