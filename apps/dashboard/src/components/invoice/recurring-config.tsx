"use client";

import { FormatAmount } from "@/components/format-amount";
import { useUserQuery } from "@/hooks/use-user";
import {
  type RecurringConfig,
  type RecurringEndType,
  calculatePreviewDates,
  calculateSummary,
  formatDayOfWeek,
  formatOrdinal,
  formatShortDate,
} from "@midday/invoice/recurring";
import { Calendar } from "@midday/ui/calendar";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { format, getDate, getDay } from "date-fns";
import * as React from "react";

// Re-export types for consumers
export type { RecurringConfig, RecurringEndType };
export type RecurringFrequency =
  | "weekly"
  | "monthly_date"
  | "monthly_weekday"
  | "custom";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];

interface RecurringConfigProps {
  issueDate: Date;
  amount: number;
  currency: string;
  config: RecurringConfig;
  onChange: (config: RecurringConfig) => void;
}

/**
 * Get smart options based on the issue date
 */
function getSmartOptions(issueDate: Date): Array<{
  value: string;
  label: string;
  frequency: RecurringFrequency;
  frequencyDay: number | null;
  frequencyWeek: number | null;
}> {
  const dayOfWeek = getDay(issueDate);
  const dayOfMonth = getDate(issueDate);
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  return [
    {
      value: "weekly",
      label: `Weekly on ${DAY_NAMES[dayOfWeek]}`,
      frequency: "weekly" as const,
      frequencyDay: dayOfWeek,
      frequencyWeek: null,
    },
    {
      value: "monthly_date",
      label: `Monthly on the ${formatOrdinal(dayOfMonth)}`,
      frequency: "monthly_date" as const,
      frequencyDay: dayOfMonth,
      frequencyWeek: null,
    },
    {
      value: "monthly_weekday",
      label: `Monthly on the ${ORDINALS[weekOfMonth - 1]} ${DAY_NAMES[dayOfWeek]}`,
      frequency: "monthly_weekday" as const,
      frequencyDay: dayOfWeek,
      frequencyWeek: weekOfMonth,
    },
    {
      value: "custom",
      label: "Custom",
      frequency: "custom" as const,
      frequencyDay: null,
      frequencyWeek: null,
    },
  ];
}

export function RecurringConfigPanel({
  issueDate,
  amount,
  currency,
  config,
  onChange,
}: RecurringConfigProps) {
  const { data: user } = useUserQuery();
  const smartOptions = React.useMemo(
    () => getSmartOptions(issueDate),
    [issueDate],
  );

  // Find current selected option value
  const currentOptionValue = React.useMemo(() => {
    if (config.frequency === "custom") return "custom";
    if (config.frequency === "weekly") return "weekly";
    if (config.frequency === "monthly_date") return "monthly_date";
    if (config.frequency === "monthly_weekday") return "monthly_weekday";
    return "weekly";
  }, [config.frequency]);

  // Calculate preview
  const previewInvoices = React.useMemo(
    () => calculatePreviewDates(config, issueDate, amount, 3),
    [config, issueDate, amount],
  );

  const summary = React.useMemo(
    () => calculateSummary(config, issueDate, amount),
    [config, issueDate, amount],
  );

  // Check if we need to show more invoices indicator
  const hasMoreInvoices =
    config.endType === "never" ||
    (config.endType === "after_count" &&
      config.endCount !== null &&
      config.endCount > 3) ||
    (config.endType === "on_date" &&
      summary.totalCount !== null &&
      summary.totalCount > 3);

  const handleFrequencyChange = (value: string) => {
    const option = smartOptions.find((o) => o.value === value);
    if (option) {
      onChange({
        ...config,
        frequency: option.frequency,
        frequencyDay: option.frequencyDay,
        frequencyWeek: option.frequencyWeek,
        frequencyInterval: option.frequency === "custom" ? 1 : null,
      });
    }
  };

  const handleEndTypeChange = (value: RecurringEndType) => {
    onChange({
      ...config,
      endType: value,
      endDate:
        value === "on_date" ? getDefaultEndDate(issueDate).toISOString() : null,
      endCount: value === "after_count" ? 12 : null,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        ...config,
        endDate: date.toISOString(),
      });
    }
  };

  const handleEndCountChange = (count: number) => {
    onChange({
      ...config,
      endCount: Math.max(1, count),
    });
  };

  // Custom frequency handlers
  const handleCustomIntervalChange = (interval: number) => {
    onChange({
      ...config,
      frequencyInterval: Math.max(1, interval),
    });
  };

  return (
    <div className="space-y-4 min-w-[300px]">
      {/* Repeat Section */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Repeat</Label>
        <Select
          value={currentOptionValue}
          onValueChange={handleFrequencyChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {smartOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Configuration - Every X days */}
      {config.frequency === "custom" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Repeat every</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={config.frequencyInterval ?? 1}
              onChange={(e) =>
                handleCustomIntervalChange(Number.parseInt(e.target.value) || 1)
              }
              className="w-20"
            />
            <span className="text-sm">days</span>
          </div>
        </div>
      )}

      {/* Ends Section */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ends</Label>
        <RadioGroup
          value={config.endType}
          onValueChange={(value) =>
            handleEndTypeChange(value as RecurringEndType)
          }
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="on_date" id="on_date" />
            <Label htmlFor="on_date" className="font-normal">
              On
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={config.endType !== "on_date"}
                  className="h-9 px-3 border border-border bg-transparent text-sm disabled:opacity-50"
                >
                  {config.endDate
                    ? format(new Date(config.endDate), "MMM d, yyyy")
                    : format(getDefaultEndDate(issueDate), "MMM d, yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                  selected={
                    config.endDate ? new Date(config.endDate) : undefined
                  }
                  onSelect={handleEndDateChange}
                  disabled={(date) => date < issueDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="after_count" id="after_count" />
            <Label htmlFor="after_count" className="font-normal">
              After
            </Label>
            <Input
              type="number"
              min={1}
              value={config.endCount ?? 12}
              onChange={(e) =>
                handleEndCountChange(Number.parseInt(e.target.value) || 12)
              }
              disabled={config.endType !== "after_count"}
              className="w-16"
            />
            <span className="text-sm">invoices</span>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="never" id="never" />
            <Label htmlFor="never" className="font-normal">
              Never
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Preview Section */}
      <div className="border-t border-border pt-3 space-y-2">
        {previewInvoices.map((invoice, index) => (
          <div
            key={index.toString()}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex gap-3">
              <span>{formatShortDate(invoice.date)}</span>
              <span className="text-muted-foreground">
                {formatDayOfWeek(invoice.date)}
              </span>
            </div>
            <FormatAmount amount={invoice.amount} currency={currency} />
          </div>
        ))}
        {hasMoreInvoices && (
          <div className="text-center text-muted-foreground">...</div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
        {summary.totalCount !== null && summary.totalAmount !== null ? (
          <>
            <span>{summary.totalCount} invoices total</span>
            <FormatAmount amount={summary.totalAmount} currency={currency} />
          </>
        ) : (
          <>
            <span>No end date</span>
            <span className="text-lg">∞</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Get default end date (1 year from issue date)
 */
function getDefaultEndDate(issueDate: Date): Date {
  const endDate = new Date(issueDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  return endDate;
}

/**
 * Get default recurring config based on issue date
 */
export function getDefaultRecurringConfig(issueDate: Date): RecurringConfig {
  const dayOfMonth = getDate(issueDate);

  return {
    frequency: "monthly_date",
    frequencyDay: dayOfMonth,
    frequencyWeek: null,
    frequencyInterval: null,
    endType: "never",
    endDate: null,
    endCount: null,
  };
}
