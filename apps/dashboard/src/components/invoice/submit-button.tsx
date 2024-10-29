"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

const options = [
  {
    label: "Create",
    value: "create",
  },
  {
    label: "Create & Send",
    value: "create_and_send",
  },
];

export function SubmitButton() {
  const [selectedOption, setSelectedOption] = useState(options[0].value);
  const { type } = useInvoiceParams();
  const form = useFormContext();
  const isValid = form.formState.isValid;

  return (
    <div className="flex divide-x">
      <Button
      // disabled={!isValid}
      >
        {type === "update"
          ? "Update"
          : options.find((o) => o.value === selectedOption)?.label}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            // disabled={!isValid}
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
              onCheckedChange={() => setSelectedOption(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
