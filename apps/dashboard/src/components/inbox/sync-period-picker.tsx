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
import { format, subDays, subMonths, subYears } from "date-fns";
import { useState } from "react";

const PRESETS = [
  {
    value: "30d",
    label: "Last 30 days",
    getDate: () => subDays(new Date(), 30),
  },
  {
    value: "3m",
    label: "Last 3 months",
    getDate: () => subMonths(new Date(), 3),
  },
  {
    value: "6m",
    label: "Last 6 months",
    getDate: () => subMonths(new Date(), 6),
  },
  { value: "1y", label: "Last year", getDate: () => subYears(new Date(), 1) },
];

interface SyncPeriodPickerProps {
  onDateChange: (date: Date) => void;
  defaultDate?: Date;
}

export function SyncPeriodPicker({
  onDateChange,
  defaultDate,
}: SyncPeriodPickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultDate,
  );
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetSelect = (presetValue: string) => {
    const preset = PRESETS.find((p) => p.value === presetValue);
    if (preset) {
      const date = preset.getDate();
      setSelectedPreset(preset.value);
      setSelectedDate(date);
      onDateChange(date);
    }
  };

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setSelectedPreset("");
      setSelectedDate(date);
      onDateChange(date);
    }
  };

  const displayLabel = selectedDate
    ? `From ${format(selectedDate, "MMM d, yyyy")}`
    : "Select period";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icons.CalendarMonth size={16} />
          <span>{displayLabel}</span>
          <Icons.ChevronDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a time range" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Calendar
            key={selectedPreset}
            className="!p-0"
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date > new Date()}
            defaultMonth={selectedDate}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
