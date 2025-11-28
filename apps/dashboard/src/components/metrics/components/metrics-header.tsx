"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { MetricsDatePicker } from "./metrics-date-picker";
import { MetricsSettings } from "./metrics-settings";

interface MetricsHeaderProps {
  from: string;
  to: string;
  fiscalYearStartMonth?: number | null;
  isCustomizing: boolean;
  onCustomizeToggle: () => void;
  onDateRangeChange: (from: string, to: string) => void;
  baseCurrency?: string;
  selectedCurrency: string | null;
  onCurrencyChange: (currency: string | null) => void;
}

export function MetricsHeader({
  from,
  to,
  fiscalYearStartMonth,
  isCustomizing,
  onCustomizeToggle,
  onDateRangeChange,
  baseCurrency,
  selectedCurrency,
  onCurrencyChange,
}: MetricsHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-6">
      <div>
        <h1 className="text-2xl font-normal mb-1 font-serif">Metrics</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Customize Button */}
        <Button
          variant="outline"
          className="space-x-2 px-3"
          onClick={onCustomizeToggle}
          data-no-close
        >
          <span>{isCustomizing ? "Save" : "Customize"}</span>
          {isCustomizing ? (
            <Icons.Check size={16} />
          ) : (
            <Icons.DashboardCustomize size={16} />
          )}
        </Button>

        {/* Date Range Picker */}
        <MetricsDatePicker
          from={from}
          to={to}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onDateRangeChange={onDateRangeChange}
        />

        {/* Settings Menu */}
        <MetricsSettings
          baseCurrency={baseCurrency}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
        />
      </div>
    </div>
  );
}
