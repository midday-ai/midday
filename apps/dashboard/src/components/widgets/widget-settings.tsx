"use client";

import { useI18n } from "@/locales/client";
import type {
  RevenueType,
  WidgetConfig,
  WidgetPeriod,
} from "@midday/cache/widget-preferences-cache";
import { Button } from "@midday/ui/button";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useState } from "react";

interface WidgetSettingsProps {
  config?: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
  onCancel: () => void;
  showPeriod?: boolean;
  showRevenueType?: boolean;
}

const periodOptions: WidgetPeriod[] = [
  "fiscal_ytd",
  "fiscal_year",
  "current_quarter",
  "trailing_12",
  "current_month",
];

export function WidgetSettings({
  config,
  onSave,
  onCancel,
  showPeriod = true,
  showRevenueType = false,
}: WidgetSettingsProps) {
  const t = useI18n();
  const [period, setPeriod] = useState<WidgetPeriod | undefined>(
    config?.period ?? "trailing_12",
  );
  const [revenueType, setRevenueType] = useState<RevenueType | undefined>(
    config?.revenueType ?? "net",
  );

  const getPeriodLabel = (p: WidgetPeriod) => {
    return t(`widget_period.${p}` as "widget_period.fiscal_ytd");
  };

  const handleSave = () => {
    const newConfig: WidgetConfig = {};
    if (showPeriod && period) {
      newConfig.period = period;
    }
    if (showRevenueType && revenueType) {
      newConfig.revenueType = revenueType;
    }
    onSave(newConfig);
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-1 -mt-2">
        {showPeriod && (
          <div className="space-y-1">
            <Label
              htmlFor="period"
              className="text-[11px] text-muted-foreground"
            >
              Period
            </Label>
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as WidgetPeriod)}
            >
              <SelectTrigger id="period" className="h-8 text-xs">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getPeriodLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showRevenueType && (
          <div className="space-y-1">
            <Label
              htmlFor="revenueType"
              className="text-[11px] text-muted-foreground"
            >
              Type
            </Label>
            <Select
              value={revenueType}
              onValueChange={(value) => setRevenueType(value as RevenueType)}
            >
              <SelectTrigger id="revenueType" className="h-8 text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="net">Net</SelectItem>
                <SelectItem value="gross">Gross</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-8 text-xs"
          type="button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 h-8 text-xs"
          type="button"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
