"use client";

import { Calendar } from "@midday/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { formatISO, parseISO } from "date-fns";
import { useUserQuery } from "@/hooks/use-user";
import { getDatePresets } from "@/utils/date-presets";

interface DateRangeFilterProps {
  start: string | null | undefined;
  end: string | null | undefined;
  onSelect: (range: { start: string | null; end: string | null }) => void;
}

export function DateRangeFilter({
  start,
  end,
  onSelect,
}: DateRangeFilterProps) {
  const { data: user } = useUserQuery();
  const presets = getDatePresets();

  // 0 = Sunday, 1 = Monday
  const weekStartsOn = user?.weekStartsOnMonday ? 1 : 0;

  return (
    <div className="flex flex-col">
      <div className="p-2 border-b border-border">
        <Select
          onValueChange={(value) => {
            const preset = presets.find((p) => p.value === value);
            if (preset?.dateRange.from && preset.dateRange.to) {
              onSelect({
                start: formatISO(preset.dateRange.from, {
                  representation: "date",
                }),
                end: formatISO(preset.dateRange.to, {
                  representation: "date",
                }),
              });
            }
          }}
        >
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem
                key={preset.value}
                value={preset.value}
                className="text-xs"
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Calendar
        mode="range"
        initialFocus
        numberOfMonths={2}
        toDate={new Date()}
        defaultMonth={new Date()}
        today={new Date()}
        weekStartsOn={weekStartsOn}
        selected={{
          from: start ? parseISO(start) : undefined,
          to: end ? parseISO(end) : undefined,
        }}
        onSelect={(range) => {
          if (!range) return;

          onSelect({
            start: range.from
              ? formatISO(range.from, { representation: "date" })
              : null,
            end: range.to
              ? formatISO(range.to, { representation: "date" })
              : null,
          });
        }}
      />
    </div>
  );
}
