"use client";

import { useTRPC } from "@/trpc/client";
import { uniqueCurrencies } from "@midday/location/currencies";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { SelectCurrency } from "../select-currency";

const dateFormats = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
  { value: "dd.MM.yyyy", label: "dd.MM.yyyy" },
];

const invoiceSizes = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

const booleanOptions = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

const menuItems = [
  {
    icon: Icons.DateFormat,
    label: "Date format",
    options: dateFormats,
    key: "dateFormat",
  },
  {
    icon: Icons.CropFree,
    label: "Invoice size",
    options: invoiceSizes,
    key: "size",
  },
  {
    icon: Icons.Tax,
    label: "Add sales tax",
    options: booleanOptions,
    key: "includeTax",
  },
  {
    icon: Icons.Vat,
    label: "Add VAT",
    options: booleanOptions,
    key: "includeVat",
  },
  {
    icon: Icons.CurrencyOutline,
    label: "Currency",
    options: uniqueCurrencies.map((currency) => ({
      value: currency,
      label: currency,
    })),
    key: "currency",
  },
  {
    icon: Icons.ConfirmationNumber,
    label: "Add discount",
    options: booleanOptions,
    key: "includeDiscount",
  },
  {
    icon: Icons.PdfOutline,
    label: "Attach PDF in email",
    options: booleanOptions,
    key: "includePdf",
  },
  {
    icon: Icons.Straighten,
    label: "Add units",
    options: booleanOptions,
    key: "includeUnits",
  },
  {
    icon: Icons.Decimals,
    label: "Decimals",
    options: booleanOptions,
    key: "includeDecimals",
  },
  {
    icon: Icons.QrCode,
    label: "Add QR code",
    options: booleanOptions,
    key: "includeQr",
  },
];

export function SettingsMenu() {
  const { watch, setValue } = useFormContext();
  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button">
          <Icons.MoreVertical className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {menuItems.map((item, index) => {
          const watchKey = `template.${item.key}`;

          if (item.key === "currency") {
            return (
              <DropdownMenuSub key={index.toString()}>
                <DropdownMenuSubTrigger>
                  <item.icon className="mr-2 size-4" />
                  <span className="text-xs">{item.label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <SelectCurrency
                    headless
                    className="text-xs"
                    currencies={uniqueCurrencies}
                    value={watch(watchKey)}
                    onChange={(value) => {
                      setValue(watchKey, value, {
                        shouldValidate: true,
                      });
                      updateTemplateMutation.mutate({
                        [item.key]: value,
                      });
                    }}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }

          return (
            <DropdownMenuSub key={index.toString()}>
              <DropdownMenuSubTrigger>
                <item.icon className="mr-2 size-4" />
                <span className="text-xs">{item.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-0 max-h-48 overflow-y-auto">
                {item.options.map((option, optionIndex) => (
                  <DropdownMenuCheckboxItem
                    key={optionIndex.toString()}
                    className="text-xs"
                    checked={watch(watchKey) === option.value}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setValue(watchKey, option.value, {
                          shouldValidate: true,
                        });

                        updateTemplateMutation.mutate({
                          [item.key]: option.value,
                        });
                      }
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
