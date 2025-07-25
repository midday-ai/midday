"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { Calendar } from "@midday/ui/calendar";
import {
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfWeek,
  formatISO,
  getDate,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import React, { useState } from "react";
import type { DateRange } from "react-day-picker";

type Props = {
  projectId: string;
  projectName: string;
};

type PresetOption = {
  label: string;
  value: string;
  dateRange: DateRange;
};

const getPresetOptions = (weekStartsOnMonday: boolean): PresetOption[] => {
  const now = new TZDate(new Date(), "UTC");
  const weekStartsOn = weekStartsOnMonday ? 1 : 0;

  return [
    {
      label: "This Week",
      value: "this-week",
      dateRange: {
        from: startOfWeek(now, { weekStartsOn }),
        to: endOfWeek(now, { weekStartsOn }),
      },
    },
    {
      label: "Last Week",
      value: "last-week",
      dateRange: {
        from: startOfWeek(subWeeks(now, 1), { weekStartsOn }),
        to: endOfWeek(subWeeks(now, 1), { weekStartsOn }),
      },
    },
    {
      label: "This Month",
      value: "this-month",
      dateRange: {
        from: startOfMonth(now),
        to: endOfMonth(now),
      },
    },
    {
      label: "Last Month",
      value: "last-month",
      dateRange: {
        from: startOfMonth(subMonths(now, 1)),
        to: endOfMonth(subMonths(now, 1)),
      },
    },
  ];
};

export function TrackerCreateInvoice({ projectId }: Props) {
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const { toast } = useToast();
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const weekStartsOnMonday = user?.weekStartsOnMonday ?? false;
  const presetOptions = getPresetOptions(weekStartsOnMonday);
  const defaultPreset = "last-month";
  const defaultPresetOption = presetOptions.find(
    (option) => option.value === defaultPreset,
  );

  const [selectedPreset, setSelectedPreset] = useState<string>(defaultPreset);
  const [date, setDate] = useState<DateRange | undefined>(
    defaultPresetOption?.dateRange,
  );

  const createInvoiceFromTrackerMutation = useMutation(
    trpc.invoice.createFromTracker.mutationOptions({
      onSuccess: (data) => {
        // Invalidate invoice queries
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        // Open the created invoice for editing
        if (data?.id) {
          setInvoiceParams({
            type: "edit",
            invoiceId: data.id,
          });
        }
      },
      onError: (error) => {
        let title = "Failed to create invoice";
        let description = "An error occurred while creating the invoice.";

        // Handle specific error codes
        switch (error.message) {
          case "PROJECT_NOT_BILLABLE":
            title = "Project not billable";
            description =
              "This project is not set as billable. Please enable billing for this project in the settings.";
            break;
          case "PROJECT_NO_RATE":
            title = "Missing hourly rate";
            description =
              "This project does not have a valid hourly rate. Please set an hourly rate for this project.";
            break;
          case "NO_TRACKED_HOURS":
            title = "No tracked time";
            description =
              "No tracked hours found for this project in the selected date range. Please track some time first.";
            break;
          case "PROJECT_NOT_FOUND":
            title = "Project not found";
            description = "The selected project could not be found.";
            break;
          default:
            // Use the original error message as fallback
            description = error.message;
        }

        toast({
          title,
          description,
        });
      },
    }),
  );

  const handlePresetSelect = (presetValue: string) => {
    const preset = presetOptions.find((option) => option.value === presetValue);
    if (preset) {
      setSelectedPreset(preset.value);
      setDate(preset.dateRange);
    }
  };

  const handleCreateInvoice = () => {
    if (!date?.from || !date?.to) {
      toast({
        title: "Please select a date range",
        description: "You need to select both start and end dates.",
      });
      return;
    }

    createInvoiceFromTrackerMutation.mutate({
      projectId,
      dateFrom: formatISO(date.from, { representation: "date" }),
      dateTo: formatISO(date.to, { representation: "date" }),
    });
  };

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Create Invoice</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <div className="p-4 space-y-4">
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
                className="!p-0 mt-0"
                mode="range"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setSelectedPreset(""); // Clear preset selection when custom date is selected
                }}
                disabled={(date) => date > new Date()}
                defaultMonth={date?.from}
                weekStartsOn={weekStartsOnMonday ? 1 : 0}
              />

              <SubmitButton
                onClick={handleCreateInvoice}
                className="w-full"
                disabled={!date?.from || !date?.to}
                isSubmitting={createInvoiceFromTrackerMutation.isPending}
              >
                Create Invoice
              </SubmitButton>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}
