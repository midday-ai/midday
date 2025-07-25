"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { SubmitButton as BaseSubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  isSubmitting: boolean;
  disabled?: boolean;
};

// Placeholder component for schedule inputs
function ScheduleInputs() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const { data: user } = useUserQuery();

  return (
    <div className="flex gap-2 mr-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker"
            className="w-32 justify-between font-normal"
          >
            {date
              ? formatDate(date.toISOString(), user?.dateFormat)
              : "Select date"}
            <Icons.ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
            disabled={(date) => date < new Date()}
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        id="time-picker"
        step="1"
        defaultValue="10:30:00"
        className="bg-background max-w-[90px] appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </div>
  );
}

export function SubmitButton({ isSubmitting, disabled }: Props) {
  const { watch, setValue, formState } = useFormContext();

  const selectedOption = watch("template.deliveryType");
  const canUpdate = watch("status") !== "draft";

  const invoiceNumberValid = !formState.errors.invoiceNumber;

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const handleOptionChange = (value: string) => {
    const deliveryType = value as "create" | "create_and_send" | "schedule";

    updateTemplateMutation.mutate({
      deliveryType,
    });

    setValue("template.deliveryType", deliveryType, {
      shouldValidate: true,
    });
  };

  const isValid = formState.isValid && invoiceNumberValid;

  const options = [
    {
      label: canUpdate ? "Update" : "Create",
      value: "create",
    },
    {
      label: canUpdate ? "Update" : "Schedule",
      value: "schedule",
    },
    {
      label: canUpdate ? "Update & Send" : "Create & Send",
      value: "create_and_send",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex divide-x">
        <div>{selectedOption === "schedule" && <ScheduleInputs />}</div>
        <BaseSubmitButton
          isSubmitting={isSubmitting}
          disabled={!isValid || disabled}
        >
          {options.find((o) => o.value === selectedOption)?.label}
        </BaseSubmitButton>

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
            {options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedOption === option.value}
                onCheckedChange={() => handleOptionChange(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
