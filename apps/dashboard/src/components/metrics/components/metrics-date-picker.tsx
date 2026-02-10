"use client";

import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { format, formatISO, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useUserQuery } from "@/hooks/use-user";
import { getPresetOptions } from "../utils/date-presets";

interface MetricsDatePickerProps {
  from: string;
  to: string;
  fiscalYearStartMonth?: number | null;
  onDateRangeChange: (from: string, to: string) => void;
}

export function MetricsDatePicker({
  from,
  to,
  fiscalYearStartMonth,
  onDateRangeChange,
}: MetricsDatePickerProps) {
  const { data: user } = useUserQuery();
  const presetOptions = getPresetOptions(fiscalYearStartMonth);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Convert from/to strings to DateRange
  const dateRange: DateRange | undefined = useMemo(() => {
    if (!from || !to) return undefined;
    try {
      return {
        from: parseISO(from),
        to: parseISO(to),
      };
    } catch {
      return undefined;
    }
  }, [from, to]);

  // Check if current date range matches a preset
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      setSelectedPreset("");
      return;
    }

    const fromDate = dateRange.from;
    const toDate = dateRange.to;

    const matchingPreset = presetOptions.find((preset) => {
      if (!preset.dateRange.from || !preset.dateRange.to) return false;
      return (
        formatISO(preset.dateRange.from, { representation: "date" }) ===
          formatISO(fromDate, { representation: "date" }) &&
        formatISO(preset.dateRange.to, { representation: "date" }) ===
          formatISO(toDate, { representation: "date" })
      );
    });

    setSelectedPreset(matchingPreset?.value || "");
  }, [dateRange, presetOptions]);

  const handlePresetSelect = (presetValue: string) => {
    const preset = presetOptions.find((option) => option.value === presetValue);
    if (preset?.dateRange.from && preset.dateRange.to) {
      setSelectedPreset(preset.value);
      onDateRangeChange(
        formatISO(preset.dateRange.from, { representation: "date" }),
        formatISO(preset.dateRange.to, { representation: "date" }),
      );
    }
  };

  const handleDateRangeSelect = (newDateRange?: DateRange) => {
    if (newDateRange?.from && newDateRange?.to) {
      setSelectedPreset(""); // Clear preset selection when custom date is selected
      onDateRangeChange(
        formatISO(newDateRange.from, { representation: "date" }),
        formatISO(newDateRange.to, { representation: "date" }),
      );
    }
  };

  return (
    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icons.CalendarMonth size={16} />
          <span>
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
              : "Select date range"}
          </span>
          <Icons.ChevronDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Calendar
            key={selectedPreset}
            className="!p-0"
            mode="range"
            weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            disabled={(date) => date > new Date()}
            defaultMonth={dateRange?.from}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
