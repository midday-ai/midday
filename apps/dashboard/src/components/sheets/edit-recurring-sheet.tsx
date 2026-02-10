"use client";

import { TZDate } from "@date-fns/tz";
import {
  calculatePreviewDates,
  formatOrdinal,
  type InvoiceRecurringEndType,
  type InvoiceRecurringFrequency,
  localDateToUTCMidnight,
  type RecurringConfig,
  validateRecurringConfig,
} from "@midday/invoice/recurring";
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
import { FormatAmount } from "@/components/format-amount";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";

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

function getSmartOptions(referenceDate: Date): Array<{
  value: string;
  label: string;
  frequency: InvoiceRecurringFrequency;
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

export function EditRecurringSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { editRecurringId, setParams } = useInvoiceParams();
  const { data: user } = useUserQuery();

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
          (recurring.frequency as InvoiceRecurringFrequency) || "monthly_date",
        frequencyDay: recurring.frequencyDay ?? null,
        frequencyWeek: recurring.frequencyWeek ?? null,
        frequencyInterval: recurring.frequencyInterval ?? null,
        endType: (recurring.endType as InvoiceRecurringEndType) || "never",
        endDate: recurring.endDate ?? null,
        endCount: recurring.endCount ?? null,
      });
    }
  }, [recurring]);

  // Validation errors
  const validationErrors = React.useMemo(
    () => validateRecurringConfig(config),
    [config],
  );
  const isValid = validationErrors.length === 0;

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
    if (!editRecurringId || !isValid || !config.endType) return;
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
    if (config.frequency === "biweekly") return "biweekly";
    if (config.frequency === "monthly_date") return "monthly_date";
    if (config.frequency === "monthly_weekday") return "monthly_weekday";
    if (config.frequency === "monthly_last_day") return "monthly_last_day";
    if (config.frequency === "quarterly") return "quarterly";
    if (config.frequency === "semi_annual") return "semi_annual";
    if (config.frequency === "annual") return "annual";
    return "weekly";
  }, [config.frequency]);

  const previewDates = React.useMemo(() => {
    if (!recurring?.nextScheduledAt) return [];

    // Calculate remaining invoices, ensuring limit is never negative
    // (e.g., when user sets endCount lower than already generated invoices)
    const remainingInvoices =
      config.endType === "after_count" && config.endCount
        ? Math.max(0, config.endCount - (recurring.invoicesGenerated ?? 0))
        : null;

    const limit =
      remainingInvoices !== null ? Math.min(remainingInvoices, 5) : 3;

    return calculatePreviewDates(
      config,
      new Date(recurring.nextScheduledAt),
      recurring.amount ?? 0,
      limit,
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
      endType: value as InvoiceRecurringEndType,
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
                            Number.parseInt(e.target.value, 10) || 1,
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
                                    new TZDate(config.endDate, "UTC"),
                                    "MMM d, yyyy",
                                  )
                                : "Select date"}
                            </Button>
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
                              onSelect={(date) => {
                                setConfig((prev) => ({
                                  ...prev,
                                  endDate: date
                                    ? localDateToUTCMidnight(date)
                                    : null,
                                }));
                              }}
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
                                endCount:
                                  Number.parseInt(e.target.value, 10) || 1,
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
                            new TZDate(recurring.nextScheduledAt, "UTC"),
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
                            {format(
                              new TZDate(invoice.date, "UTC"),
                              "MMM d, yyyy",
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {format(new TZDate(invoice.date, "UTC"), "EEE")}
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
              {validationErrors.length > 0 && (
                <div className="mb-3 text-sm text-destructive">
                  {validationErrors[0]?.message}
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <SubmitButton
                  onClick={handleSave}
                  isSubmitting={updateMutation.isPending}
                  disabled={!isValid}
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
