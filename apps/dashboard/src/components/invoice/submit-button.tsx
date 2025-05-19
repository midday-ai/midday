"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { SubmitButton as BaseSubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";

type Props = {
  isSubmitting: boolean;
  disabled?: boolean;
};

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
    const deliveryType = value as "create" | "create_and_send";

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
      label: canUpdate ? "Update & Send" : "Create & Send",
      value: "create_and_send",
    },
  ];

  return (
    <div className="flex divide-x">
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
  );
}
