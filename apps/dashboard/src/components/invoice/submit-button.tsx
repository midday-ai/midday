"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
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
import { format, setHours, startOfTomorrow } from "date-fns";
import * as React from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  isSubmitting: boolean;
  disabled?: boolean;
};

export function SubmitButton({ isSubmitting, disabled }: Props) {
  const { watch, setValue, formState } = useFormContext();
  const { data: user } = useUserQuery();

  // Get next day date/time rounded to nearest hour
  const getDefaultScheduleDateTime = () => {
    const now = new Date();
    const roundedHour =
      now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();

    // Start with tomorrow at midnight, then set the rounded hour
    return setHours(startOfTomorrow(), roundedHour);
  };

  const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>(
    () => {
      const existingScheduledAt = watch("scheduledAt");
      return existingScheduledAt
        ? new Date(existingScheduledAt)
        : getDefaultScheduleDateTime();
    },
  );

  const [scheduleTime, setScheduleTime] = React.useState<string>(() => {
    const existingScheduledAt = watch("scheduledAt");
    const initialDateTime = existingScheduledAt
      ? new Date(existingScheduledAt)
      : getDefaultScheduleDateTime();
    return initialDateTime.toTimeString().slice(0, 5); // Format as HH:MM
  });

  // Sync with form scheduledAt changes (for when invoice data is loaded)
  React.useEffect(() => {
    const currentScheduledAt = watch("scheduledAt");
    if (currentScheduledAt) {
      const scheduledDateTime = new Date(currentScheduledAt);
      setScheduleDate(scheduledDateTime);
      setScheduleTime(scheduledDateTime.toTimeString().slice(0, 5));
    }
  }, [watch("scheduledAt")]);

  // Helper function to update scheduledAt with provided date and time
  const updateScheduledAt = (date: Date, time: string) => {
    const timeParts = time.split(":").map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    setValue("scheduledAt", scheduledDateTime.toISOString(), {
      shouldValidate: true,
    });
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
  const canUpdate = watch("status") !== "draft";

  const invoiceNumberValid = !formState.errors.invoiceNumber;

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const cancelScheduleMutation = useMutation(
    trpc.invoice.cancelSchedule.mutationOptions(),
  );

  const handleOptionChange = (value: string) => {
    const deliveryType = value as "create" | "create_and_send" | "scheduled";
    const currentDeliveryType = watch("template.deliveryType");
    const invoiceId = watch("id");

    // Only save create and create_and_send to template, not scheduled
    if (deliveryType !== "scheduled") {
      updateTemplateMutation.mutate({
        deliveryType,
      });

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
    } else {
      // Clear scheduledAt for non-scheduled delivery types
      setValue("scheduledAt", null, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const isValid = formState.isValid && invoiceNumberValid;

  const options = [
    {
      label: canUpdate ? "Update" : "Create",
      value: "create",
    },
    {
      label: canUpdate ? "Update & Send" : "Create & Send",
      value: "create_and_send",
    },
    {
      label: canUpdate ? "Update" : "Schedule",
      value: "scheduled",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex divide-x">
        <BaseSubmitButton
          isSubmitting={isSubmitting}
          disabled={!isValid || disabled}
        >
          {selectedOption === "scheduled" && scheduleDate && scheduleTime
            ? `Schedule (${format(scheduleDate, "MMM d")} ${scheduleTime})`
            : options.find((o) => o.value === selectedOption)?.label}
        </BaseSubmitButton>

        {selectedOption === "scheduled" && canUpdate ? (
          // Show calendar and time input directly when invoice is already scheduled and can be updated
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={!isValid || isSubmitting || disabled}
                className="size-9 p-0 [&[data-state=open]>svg]:rotate-180"
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
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
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
                className="size-9 p-0 [&[data-state=open]>svg]:rotate-180"
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
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
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
