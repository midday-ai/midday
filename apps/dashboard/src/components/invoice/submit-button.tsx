"use client";

import {
  getFrequencyLabel,
  localDateToUTCMidnight,
} from "@midday/invoice/recurring";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { SubmitButton as BaseSubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import {
  addHours,
  addMilliseconds,
  addMonths,
  differenceInMilliseconds,
  format,
  getMinutes,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import {
  getDefaultRecurringConfig,
  type RecurringConfig,
  RecurringConfigPanel,
} from "./recurring-config";

type Props = {
  isSubmitting: boolean;
  disabled?: boolean;
  className?: string;
};

export function SubmitButton({ isSubmitting, disabled, className }: Props) {
  const { watch, setValue, formState } = useFormContext();
  const { data: user } = useUserQuery();

  // Get default schedule date/time: today, rounded up to the next hour + 1 hour buffer
  const getDefaultScheduleDateTime = () => {
    const now = new Date();
    const minutes = getMinutes(now);

    // Round up to the next hour, add 1 more hour for buffer
    const nextHour = addHours(setMinutes(now, 0), minutes > 0 ? 2 : 1);

    return nextHour;
  };

  const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(
    () => {
      const existingScheduledAt = watch("scheduledAt");
      if (existingScheduledAt) {
        // Parse and normalize to start of day for calendar display
        const parsed = new Date(existingScheduledAt);
        return startOfDay(parsed);
      }
      // Use start of day for calendar display
      return startOfDay(getDefaultScheduleDateTime());
    },
  );

  const [scheduleTime, setScheduleTime] = React.useState<string>(() => {
    const existingScheduledAt = watch("scheduledAt");
    const initialDateTime = existingScheduledAt
      ? new Date(existingScheduledAt)
      : getDefaultScheduleDateTime();
    // Use date-fns format for consistent time formatting
    return format(initialDateTime, "HH:mm");
  });

  // Recurring invoice state
  const issueDate = watch("issueDate");
  const amount = watch("amount") || 0;
  const currency = watch("template.currency") || "USD";
  const invoiceRecurringId = watch("invoiceRecurringId");

  // Check if invoice is already part of a recurring series
  const isPartOfRecurringSeries = !!invoiceRecurringId;

  // Get recurring config from form state or use default
  const formRecurringConfig = watch("recurringConfig");
  const recurringConfig =
    formRecurringConfig ||
    getDefaultRecurringConfig(issueDate ? new Date(issueDate) : new Date());

  const setRecurringConfig = (config: RecurringConfig) => {
    setValue("recurringConfig", config, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Track previous issue date to detect actual changes
  const prevIssueDateRef = React.useRef(issueDate);

  // Initialize recurring config when not set
  React.useEffect(() => {
    if (!formRecurringConfig && issueDate) {
      setValue(
        "recurringConfig",
        getDefaultRecurringConfig(new Date(issueDate)),
        {
          shouldValidate: false,
          shouldDirty: false,
        },
      );
    }
  }, [issueDate, formRecurringConfig, setValue]);

  // Update recurring config when issue date changes (for smart defaults)
  React.useEffect(() => {
    const prevIssueDate = prevIssueDateRef.current;
    prevIssueDateRef.current = issueDate;

    // Only run when issueDate actually changed (not when formRecurringConfig changed)
    if (prevIssueDate === issueDate) {
      return;
    }

    if (issueDate && formRecurringConfig) {
      const newDate = new Date(issueDate);
      // Use UTC methods since issueDate is stored as UTC midnight
      const dayOfWeek = newDate.getUTCDay();
      const dayOfMonth = newDate.getUTCDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);

      // Frequencies that use day of week
      const usesWeekday =
        formRecurringConfig.frequency === "weekly" ||
        formRecurringConfig.frequency === "biweekly";

      // Frequencies that use day of month (quarterly, semi_annual, annual work like monthly_date)
      const usesDayOfMonth =
        formRecurringConfig.frequency === "monthly_date" ||
        formRecurringConfig.frequency === "quarterly" ||
        formRecurringConfig.frequency === "semi_annual" ||
        formRecurringConfig.frequency === "annual";

      const shouldUpdate =
        (usesWeekday && formRecurringConfig.frequencyDay !== dayOfWeek) ||
        (usesDayOfMonth && formRecurringConfig.frequencyDay !== dayOfMonth) ||
        (formRecurringConfig.frequency === "monthly_weekday" &&
          (formRecurringConfig.frequencyDay !== dayOfWeek ||
            formRecurringConfig.frequencyWeek !== weekOfMonth));

      if (shouldUpdate) {
        const updatedConfig = usesWeekday
          ? { ...formRecurringConfig, frequencyDay: dayOfWeek }
          : usesDayOfMonth
            ? { ...formRecurringConfig, frequencyDay: dayOfMonth }
            : formRecurringConfig.frequency === "monthly_weekday"
              ? {
                  ...formRecurringConfig,
                  frequencyDay: dayOfWeek,
                  frequencyWeek: weekOfMonth,
                }
              : formRecurringConfig;

        setValue("recurringConfig", updatedConfig, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [issueDate, formRecurringConfig, setValue]);

  // Sync with form scheduledAt changes (for when invoice data is loaded)
  React.useEffect(() => {
    const currentScheduledAt = watch("scheduledAt");
    if (currentScheduledAt) {
      const scheduledDateTime = new Date(currentScheduledAt);
      // Normalize to start of day for calendar display
      setScheduleDate(startOfDay(scheduledDateTime));
      // Use date-fns format for consistent time formatting
      setScheduleTime(format(scheduledDateTime, "HH:mm"));
    }
  }, [watch("scheduledAt")]);

  // Helper function to update scheduledAt with provided date and time
  const updateScheduledAt = (date: Date, time: string) => {
    const timeParts = time.split(":").map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;

    // Use date-fns for time manipulation
    const scheduledDateTime = setMinutes(setHours(date, hours), minutes);

    setValue("scheduledAt", scheduledDateTime.toISOString(), {
      shouldValidate: true,
    });

    // Auto-adjust issue date and due date when scheduling
    const currentIssueDate = watch("issueDate");
    const currentDueDate = watch("dueDate");

    if (currentIssueDate && currentDueDate) {
      const issueDateTime = parseISO(currentIssueDate);
      const dueDateTime = parseISO(currentDueDate);

      // Calculate the payment period
      const paymentPeriodMs = differenceInMilliseconds(
        dueDateTime,
        issueDateTime,
      );

      // Set issue date to the scheduled date (normalize to UTC midnight)
      const newIssueDateStr = localDateToUTCMidnight(date);
      const newIssueDate = new Date(newIssueDateStr);

      // Set due date to maintain the same payment period
      const newDueDate = addMilliseconds(newIssueDate, paymentPeriodMs);

      setValue("issueDate", newIssueDateStr, {
        shouldValidate: true,
        shouldDirty: true,
      });

      setValue("dueDate", newDueDate.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Handler to set date and automatically switch to scheduled
  const handleDateChange = (date: Date | undefined) => {
    setScheduleDate(date);
    if (date) {
      handleOptionChange("scheduled");
      // Update scheduledAt immediately with the new date
      updateScheduledAt(date, scheduleTime);
    }
  };

  // Handler to set time and automatically switch to scheduled
  const handleTimeChange = (time: string) => {
    setScheduleTime(time);
    if (scheduleDate) {
      handleOptionChange("scheduled");
      // Update scheduledAt immediately with the new time
      updateScheduledAt(scheduleDate, time);
    }
  };

  const selectedOption = watch("template.deliveryType");
  // Show "Update" instead of "Create" if not a draft OR if part of a recurring series
  const canUpdate = watch("status") !== "draft" || isPartOfRecurringSeries;

  const invoiceNumberValid = !formState.errors.invoiceNumber;

  const trpc = useTRPC();
  const { updateTemplate } = useTemplateUpdate();

  const cancelScheduleMutation = useMutation(
    trpc.invoice.cancelSchedule.mutationOptions(),
  );

  const handleOptionChange = (value: string) => {
    const deliveryType = value as
      | "create"
      | "create_and_send"
      | "scheduled"
      | "recurring";
    const currentDeliveryType = watch("template.deliveryType");
    const invoiceId = watch("id");

    // Only save create and create_and_send to template, not scheduled or recurring
    if (deliveryType !== "scheduled" && deliveryType !== "recurring") {
      updateTemplate({ deliveryType });

      // If changing from scheduled to another type, cancel the scheduled job
      if (currentDeliveryType === "scheduled" && invoiceId) {
        cancelScheduleMutation.mutate({ id: invoiceId });
      }
    }

    setValue("template.deliveryType", deliveryType, {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Handle scheduledAt based on delivery type
    if (deliveryType === "scheduled" && scheduleDate && scheduleTime) {
      // Update scheduledAt for scheduled delivery
      updateScheduledAt(scheduleDate, scheduleTime);
    } else if (deliveryType === "recurring") {
      // Clear scheduledAt for recurring - recurring has its own scheduling
      setValue("scheduledAt", null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      // Clear scheduledAt for non-scheduled delivery types
      setValue("scheduledAt", null, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Reset issue date to today and due date to 1 month from today when switching away from scheduled
      if (currentDeliveryType === "scheduled") {
        const now = new Date();
        const todayStr = localDateToUTCMidnight(now);
        const today = new Date(todayStr);
        const nextMonth = addMonths(today, 1);

        setValue("issueDate", todayStr, {
          shouldValidate: true,
          shouldDirty: true,
        });

        setValue("dueDate", nextMonth.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  // Get recurring label for button display
  const getRecurringButtonLabel = () => {
    return getFrequencyLabel(
      recurringConfig.frequency,
      recurringConfig.frequencyDay,
      recurringConfig.frequencyWeek,
    );
  };

  const isValid = formState.isValid && invoiceNumberValid;

  // Build options based on invoice state
  // - Hide "Recurring" if invoice is already part of a recurring series
  // - Hide "Recurring" if invoice is scheduled (can't convert scheduled to recurring)
  // - Hide "Schedule" if invoice is already part of a recurring series
  const isScheduledInvoice = selectedOption === "scheduled";
  const baseOptions = [
    {
      label: canUpdate ? "Update" : "Create",
      value: "create",
    },
    {
      label: canUpdate ? "Update & Send" : "Create & Send",
      value: "create_and_send",
    },
  ];

  // Only show schedule option for non-recurring invoices (recurring has its own scheduling)
  const optionsWithSchedule = isPartOfRecurringSeries
    ? baseOptions
    : [
        ...baseOptions,
        {
          label: "Schedule",
          value: "scheduled",
        },
      ];

  // Hide "Recurring" option if:
  // 1. Invoice is already part of a recurring series, OR
  // 2. Invoice is currently scheduled (can't convert scheduled to recurring)
  const options =
    isPartOfRecurringSeries || isScheduledInvoice
      ? optionsWithSchedule
      : [
          ...optionsWithSchedule,
          {
            label: "Recurring",
            value: "recurring",
          },
        ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex divide-x">
        <BaseSubmitButton
          isSubmitting={isSubmitting}
          disabled={!isValid || disabled}
          className={className}
        >
          {selectedOption === "scheduled" && scheduleDate && scheduleTime
            ? `Schedule (${format(scheduleDate, "MMM d")} ${scheduleTime})`
            : selectedOption === "recurring"
              ? `Recurring (${getRecurringButtonLabel()})`
              : options.find((o) => o.value === selectedOption)?.label}
        </BaseSubmitButton>

        {selectedOption === "scheduled" && canUpdate ? (
          // Show calendar and time input directly when invoice is already scheduled and can be updated
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={!isValid || isSubmitting || disabled}
                className={`size-9 p-0 [&[data-state=open]>svg]:rotate-180 ${className ?? ""}`}
              >
                <Icons.ChevronDown className="size-4 transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10}>
              <div className="p-4 space-y-4 min-w-[230px]">
                <div className="space-y-2">
                  <Calendar
                    mode="single"
                    weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                    selected={scheduleDate}
                    defaultMonth={scheduleDate}
                    onSelect={handleDateChange}
                    disabled={(date) => {
                      // Allow selecting today or later (time validation happens on submit)
                      const today = startOfDay(new Date());
                      return date < today;
                    }}
                    className="!p-0"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="time"
                    id="schedule-time"
                    value={scheduleTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Show normal dropdown with all options when not scheduled or when creating new
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={!isValid || isSubmitting || disabled}
                className={`size-9 p-0 [&[data-state=open]>svg]:rotate-180 ${className ?? ""}`}
              >
                <Icons.ChevronDown className="size-4 transition-transform duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10}>
              {options.map((option) => {
                if (option.value === "scheduled") {
                  return (
                    <DropdownMenuSub key={option.value}>
                      <DropdownMenuSubTrigger>
                        <div className="flex items-center pl-2">
                          {option.label}
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-4 space-y-4 min-w-[230px] mb-2">
                          <div className="space-y-2">
                            <Calendar
                              mode="single"
                              weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                              selected={scheduleDate}
                              defaultMonth={scheduleDate}
                              onSelect={handleDateChange}
                              disabled={(date) => {
                                // Allow selecting today or later (time validation happens on submit)
                                const today = startOfDay(new Date());
                                return date < today;
                              }}
                              className="!p-0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Input
                              type="time"
                              id="schedule-time"
                              value={scheduleTime}
                              onChange={(e) => handleTimeChange(e.target.value)}
                              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  );
                }

                if (option.value === "recurring") {
                  return (
                    <DropdownMenuSub key={option.value}>
                      <DropdownMenuSubTrigger>
                        <div className="flex items-center gap-2 pl-2">
                          {option.label}
                          <Badge
                            variant="tag"
                            className="text-[10px] px-1.5 py-0 h-4 font-medium"
                          >
                            Beta
                          </Badge>
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="p-4 mb-2">
                          <RecurringConfigPanel
                            issueDate={
                              issueDate ? new Date(issueDate) : new Date()
                            }
                            amount={amount}
                            currency={currency}
                            config={recurringConfig}
                            onChange={setRecurringConfig}
                            onSelect={() => handleOptionChange("recurring")}
                          />
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  );
                }

                return (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedOption === option.value}
                    onCheckedChange={() => handleOptionChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
