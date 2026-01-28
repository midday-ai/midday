"use client";

import { Button } from "@midday/ui/button";
import { CurrencyInput } from "@midday/ui/currency-input";
import { Label } from "@midday/ui/label";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useState } from "react";

type TypeValue = "income" | "expense" | "any";

export function AmountRange() {
  // URL state for filters
  const [amountRange, setAmountRange] = useQueryState(
    "amount_range",
    parseAsArrayOf(parseAsInteger),
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringLiteral(["income", "expense"] as const),
  );

  // Local state for inputs (before applying)
  const [typeValue, setTypeValue] = useState<TypeValue>(
    typeFilter === "income"
      ? "income"
      : typeFilter === "expense"
        ? "expense"
        : "any",
  );
  const [minAmount, setMinAmount] = useState<string>(
    amountRange?.[0]?.toString() ?? "",
  );
  const [maxAmount, setMaxAmount] = useState<string>(() => {
    const max = amountRange?.[1];
    // Don't display the sentinel value used for "no max" filtering
    if (max === Number.MAX_SAFE_INTEGER) return "";
    return max?.toString() ?? "";
  });

  const handleApplyFilters = () => {
    // Set type filter
    if (typeValue === "any") {
      setTypeFilter(null);
    } else {
      setTypeFilter(typeValue);
    }

    // Set amount range
    const min = minAmount ? Number.parseFloat(minAmount) : null;
    const max = maxAmount ? Number.parseFloat(maxAmount) : null;

    if (min !== null || max !== null) {
      setAmountRange([min ?? 0, max ?? Number.MAX_SAFE_INTEGER]);
    } else {
      setAmountRange(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Direction */}
      <div className="space-y-3">
        <Label className="text-xs text-[#878787]">Direction</Label>
        <RadioGroup
          value={typeValue}
          onValueChange={(value) => setTypeValue(value as TypeValue)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="type-in" />
            <Label
              htmlFor="type-in"
              className="text-sm font-normal cursor-pointer"
            >
              In{" "}
              <span className="text-[#878787]">(e.g. deposits, refunds)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expense" id="type-out" />
            <Label
              htmlFor="type-out"
              className="text-sm font-normal cursor-pointer"
            >
              Out{" "}
              <span className="text-[#878787]">(e.g. purchases, charges)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="type-any" />
            <Label
              htmlFor="type-any"
              className="text-sm font-normal cursor-pointer"
            >
              Not specified <span className="text-[#878787]">(both)</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* At least... */}
      <div className="space-y-2">
        <Label className="text-xs text-[#878787]">At least...</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] text-sm">
            ≥
          </span>
          <CurrencyInput
            className="w-full pl-7 text-sm"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label="Minimum amount"
          />
        </div>
      </div>

      {/* No more than... */}
      <div className="space-y-2">
        <Label className="text-xs text-[#878787]">No more than...</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787] text-sm">
            ≤
          </span>
          <CurrencyInput
            className="w-full pl-7 text-sm"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label="Maximum amount"
          />
        </div>
      </div>

      {/* Apply button */}
      <Button
        className="w-full text-xs"
        variant="outline"
        onClick={handleApplyFilters}
      >
        Apply
      </Button>
    </div>
  );
}
