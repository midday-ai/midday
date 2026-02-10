"use client";

import { TZDate } from "@date-fns/tz";
import {
  calculatePreviewDates,
  calculateSummary,
  formatDayOfWeek,
  formatOrdinal,
  formatShortDate,
  type InvoiceRecurringEndType,
  type InvoiceRecurringFrequency,
  localDateToUTCMidnight,
  type RecurringConfig,
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
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { FormatAmount } from "@/components/format-amount";
import { useUserQuery } from "@/hooks/use-user";

// Re-export canonical types for consumers
export type { RecurringConfig };

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
  /** Called when user selects an end type - use this to confirm the recurring selection */
  onSelect?: () => void;
}

/**
 * Get smart options based on the issue date
 */
function getSmartOptions(issueDate: Date): Array<{
  value: string;
  label: string;
  frequency: InvoiceRecurringFrequency;
  frequencyDay: number | null;
  frequencyWeek: number | null;
}> {
  // Use UTC methods since issue date is stored as UTC midnight
  const dayOfWeek = issueDate.getUTCDay();
  const dayOfMonth = issueDate.getUTCDate();
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
      value: "biweekly",
      label: `Bi-weekly on ${DAY_NAMES[dayOfWeek]}`,
      frequency: "biweekly" as const,
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
      value: "monthly_last_day",
      label: "Monthly on the last day",
      frequency: "monthly_last_day" as const,
      frequencyDay: null,
      frequencyWeek: null,
    },
    {
      value: "quarterly",
      label: `Quarterly on the ${formatOrdinal(dayOfMonth)}`,
      frequency: "quarterly" as const,
      frequencyDay: dayOfMonth,
      frequencyWeek: null,
    },
    {
      value: "semi_annual",
      label: `Semi-annually on the ${formatOrdinal(dayOfMonth)}`,
      frequency: "semi_annual" as const,
      frequencyDay: dayOfMonth,
      frequencyWeek: null,
    },
    {
      value: "annual",
      label: `Annually on the ${formatOrdinal(dayOfMonth)}`,
      frequency: "annual" as const,
      frequencyDay: dayOfMonth,
      frequencyWeek: null,
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
  onSelect,
}: RecurringConfigProps) {
  const { data: user } = useUserQuery();
  const smartOptions = React.useMemo(
    () => getSmartOptions(issueDate),
    [issueDate],
  );

  // Track if preview was already visible on mount (to skip animation on dropdown reopen)
  const wasVisibleOnMountRef = React.useRef(config.endType !== null);

  // Find current selected option value
  const currentOptionValue = React.useMemo(() => {
    if (config.frequency === "custom") return "custom";
    if (config.frequency === "weekly") return "weekly";
    if (config.frequency === "biweekly") return "biweekly";
    if (config.frequency === "monthly_date") return "monthly_date";
    if (config.frequency === "monthly_weekday") return "monthly_weekday";
    if (config.frequency === "monthly_last_day") return "monthly_last_day";
    if (config.frequency === "quarterly") return "quarterly";
    if (config.frequency === "semi_annual") return "semi_annual";
    if (config.frequency === "annual") return "annual";
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

  const handleEndTypeChange = (value: InvoiceRecurringEndType) => {
    onChange({
      ...config,
      endType: value,
      endDate:
        value === "on_date" ? getDefaultEndDate(issueDate).toISOString() : null,
      endCount: value === "after_count" ? 12 : null,
    });
    // Confirm the recurring selection when user selects an end type
    onSelect?.();
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        ...config,
        endDate: localDateToUTCMidnight(date),
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
                handleCustomIntervalChange(
                  Number.parseInt(e.target.value, 10) || 1,
                )
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
          value={config.endType ?? undefined}
          onValueChange={(value) =>
            handleEndTypeChange(value as InvoiceRecurringEndType)
          }
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="on_date" id="on_date" />
            <Label
              htmlFor="on_date"
              className="font-normal text-sm text-primary"
            >
              On
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={config.endType !== "on_date"}
                  className="h-9 px-3 border border-border bg-transparent text-sm text-primary disabled:opacity-50"
                >
                  {config.endDate
                    ? format(new TZDate(config.endDate, "UTC"), "MMM d, yyyy")
                    : format(getDefaultEndDate(issueDate), "MMM d, yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                  selected={
                    config.endDate
                      ? new TZDate(config.endDate, "UTC")
                      : undefined
                  }
                  defaultMonth={
                    config.endDate
                      ? new TZDate(config.endDate, "UTC")
                      : getDefaultEndDate(issueDate)
                  }
                  onSelect={handleEndDateChange}
                  disabled={(date) => date < issueDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="after_count" id="after_count" />
            <Label
              htmlFor="after_count"
              className="font-normal text-sm text-primary"
            >
              After
            </Label>
            <Input
              type="number"
              min={1}
              value={config.endCount ?? 12}
              onChange={(e) =>
                handleEndCountChange(Number.parseInt(e.target.value, 10) || 12)
              }
              disabled={config.endType !== "after_count"}
              className="w-16"
            />
            <span className="text-sm text-primary">invoices</span>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="never" id="never" />
            <Label htmlFor="never" className="font-normal text-sm text-primary">
              Never
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Preview Section - only shown when endType is selected */}
      <AnimatePresence initial={!wasVisibleOnMountRef.current}>
        {config.endType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
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
                  <FormatAmount
                    amount={summary.totalAmount}
                    currency={currency}
                  />
                </>
              ) : (
                <>
                  <span>No end date</span>
                  <span className="text-lg">∞</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  // Use UTC method since issue date is stored as UTC midnight
  const dayOfMonth = issueDate.getUTCDate();

  return {
    frequency: "monthly_date",
    frequencyDay: dayOfMonth,
    frequencyWeek: null,
    frequencyInterval: null,
    endType: null, // User must explicitly select to confirm recurring
    endDate: null,
    endCount: null,
  };
}
