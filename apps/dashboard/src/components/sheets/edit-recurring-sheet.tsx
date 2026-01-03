"use client";

import { FormatAmount } from "@/components/format-amount";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { formatOrdinal } from "@midday/invoice/recurring";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, getDate, getDay } from "date-fns";
import * as React from "react";

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

type RecurringFrequency =
  | "weekly"
  | "monthly_date"
  | "monthly_weekday"
  | "custom";

type RecurringEndType = "never" | "on_date" | "after_count";

interface RecurringConfig {
  frequency: RecurringFrequency;
  frequencyDay: number | null;
  frequencyWeek: number | null;
  frequencyInterval: number | null;
  endType: RecurringEndType;
  endDate: string | null;
  endCount: number | null;
}

interface UpcomingInvoice {
  date: Date;
  amount: number;
}

function calculatePreviewDates(
  config: RecurringConfig,
  startDate: Date,
  amount: number,
  limit = 3,
): UpcomingInvoice[] {
  const invoices: UpcomingInvoice[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < limit; i++) {
    if (config.endType === "on_date" && config.endDate) {
      if (currentDate > new Date(config.endDate)) break;
    }
    if (config.endType === "after_count" && config.endCount !== null) {
      if (i >= config.endCount) break;
    }

    invoices.push({
      date: new Date(currentDate),
      amount,
    });

    currentDate = getNextDate(config, currentDate);
  }

  return invoices;
}

function getNextDate(config: RecurringConfig, currentDate: Date): Date {
  const next = new Date(currentDate);

  switch (config.frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly_date":
    case "monthly_weekday":
      next.setMonth(next.getMonth() + 1);
      break;
    case "custom":
      next.setDate(next.getDate() + (config.frequencyInterval ?? 1));
      break;
  }

  return next;
}

function getSmartOptions(referenceDate: Date): Array<{
  value: string;
  label: string;
  frequency: RecurringFrequency;
  frequencyDay: number | null;
  frequencyWeek: number | null;
}> {
  const dayOfWeek = getDay(referenceDate);
  const dayOfMonth = getDate(referenceDate);
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

export function EditRecurringSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { editRecurringId, setParams } = useInvoiceParams();

  const isOpen = Boolean(editRecurringId);

  // Local state for editing
  const [config, setConfig] = React.useState<RecurringConfig>({
    frequency: "monthly_date",
    frequencyDay: null,
    frequencyWeek: null,
    frequencyInterval: null,
    endType: "never",
    endDate: null,
    endCount: null,
  });

  // Fetch current recurring series data
  const { data: recurring, isLoading } = useQuery({
    ...trpc.invoiceRecurring.get.queryOptions({ id: editRecurringId! }),
    enabled: isOpen,
  });

  // Sync local state when data loads
  React.useEffect(() => {
    if (recurring) {
      setConfig({
        frequency:
          (recurring.frequency as RecurringFrequency) || "monthly_date",
        frequencyDay: recurring.frequencyDay ?? null,
        frequencyWeek: recurring.frequencyWeek ?? null,
        frequencyInterval: recurring.frequencyInterval ?? null,
        endType: (recurring.endType as RecurringEndType) || "never",
        endDate: recurring.endDate ?? null,
        endCount: recurring.endCount ?? null,
      });
    }
  }, [recurring]);

  const updateMutation = useMutation(
    trpc.invoiceRecurring.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.getUpcoming.queryKey(),
        });
        setParams({ editRecurringId: null });
      },
    }),
  );

  const handleSave = () => {
    if (!editRecurringId) return;
    updateMutation.mutate({
      id: editRecurringId,
      frequency: config.frequency,
      frequencyDay: config.frequencyDay,
      frequencyWeek: config.frequencyWeek,
      frequencyInterval: config.frequencyInterval,
      endType: config.endType,
      endDate: config.endDate,
      endCount: config.endCount,
    });
  };

  const handleClose = () => {
    setParams({ editRecurringId: null });
  };

  // Reference date for smart options (use next scheduled date or today)
  const referenceDate = React.useMemo(() => {
    if (recurring?.nextScheduledAt) {
      return new Date(recurring.nextScheduledAt);
    }
    return new Date();
  }, [recurring?.nextScheduledAt]);

  const smartOptions = React.useMemo(
    () => getSmartOptions(referenceDate),
    [referenceDate],
  );

  const currentOptionValue = React.useMemo(() => {
    if (config.frequency === "custom") return "custom";
    if (config.frequency === "weekly") return "weekly";
    if (config.frequency === "monthly_date") return "monthly_date";
    if (config.frequency === "monthly_weekday") return "monthly_weekday";
    return "weekly";
  }, [config.frequency]);

  const previewDates = React.useMemo(() => {
    if (!recurring?.nextScheduledAt) return [];
    return calculatePreviewDates(
      config,
      new Date(recurring.nextScheduledAt),
      recurring.amount ?? 0,
      config.endType === "after_count" && config.endCount
        ? Math.min(config.endCount - (recurring.invoicesGenerated ?? 0), 5)
        : 3,
    );
  }, [config, recurring]);

  const handleFrequencyChange = (value: string) => {
    const option = smartOptions.find((opt) => opt.value === value);
    if (option) {
      setConfig((prev) => ({
        ...prev,
        frequency: option.frequency,
        frequencyDay: option.frequencyDay,
        frequencyWeek: option.frequencyWeek,
        frequencyInterval:
          option.frequency === "custom" ? prev.frequencyInterval || 14 : null,
      }));
    }
  };

  const handleEndTypeChange = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      endType: value as RecurringEndType,
      endDate: value === "on_date" ? prev.endDate : null,
      endCount: value === "after_count" ? prev.endCount || 12 : null,
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent stack>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Edit recurring settings</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                <Icons.Close className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Frequency Select */}
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={currentOptionValue}
                    onValueChange={handleFrequencyChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency" />
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

                {/* Custom interval input */}
                {config.frequency === "custom" && (
                  <div className="space-y-2">
                    <Label>Every X days</Label>
                    <Input
                      type="number"
                      min={1}
                      value={config.frequencyInterval ?? ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          frequencyInterval:
                            Number.parseInt(e.target.value) || 1,
                        }))
                      }
                      placeholder="14"
                    />
                  </div>
                )}

                {/* End Conditions */}
                <div className="space-y-3">
                  <Label>Ends</Label>
                  <RadioGroup
                    value={config.endType}
                    onValueChange={handleEndTypeChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="never" />
                      <Label
                        htmlFor="never"
                        className="font-normal cursor-pointer"
                      >
                        Never
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on_date" id="on_date" />
                      <Label
                        htmlFor="on_date"
                        className="font-normal cursor-pointer"
                      >
                        On date
                      </Label>
                      {config.endType === "on_date" && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                            >
                              {config.endDate
                                ? format(
                                    new Date(config.endDate),
                                    "MMM d, yyyy",
                                  )
                                : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                config.endDate
                                  ? new Date(config.endDate)
                                  : undefined
                              }
                              onSelect={(date) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  endDate: date ? date.toISOString() : null,
                                }))
                              }
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after_count" id="after_count" />
                      <Label
                        htmlFor="after_count"
                        className="font-normal cursor-pointer"
                      >
                        After
                      </Label>
                      {config.endType === "after_count" && (
                        <div className="flex items-center space-x-2 ml-2">
                          <Input
                            type="number"
                            min={1}
                            value={config.endCount ?? ""}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                endCount: Number.parseInt(e.target.value) || 1,
                              }))
                            }
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            invoices
                          </span>
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Invoices generated
                    </span>
                    <span>{recurring?.invoicesGenerated ?? 0}</span>
                  </div>
                  {recurring?.nextScheduledAt &&
                    recurring.status === "active" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Next invoice
                        </span>
                        <span>
                          {format(
                            new Date(recurring.nextScheduledAt),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                    )}
                </div>

                {/* Preview */}
                {previewDates.length > 0 && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <span className="text-sm font-medium">
                      Upcoming invoices
                    </span>
                    {previewDates.map((invoice, index) => (
                      <div
                        key={index.toString()}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex">
                          <span className="w-[100px]">
                            {format(invoice.date, "MMM d, yyyy")}
                          </span>
                          <span className="text-muted-foreground">
                            {format(invoice.date, "EEE")}
                          </span>
                        </div>
                        <FormatAmount
                          amount={invoice.amount}
                          currency={recurring?.currency ?? "USD"}
                        />
                      </div>
                    ))}
                    {config.endType === "never" && (
                      <div className="text-center text-muted-foreground">
                        ...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <SubmitButton
                  onClick={handleSave}
                  isSubmitting={updateMutation.isPending}
                >
                  Save changes
                </SubmitButton>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
