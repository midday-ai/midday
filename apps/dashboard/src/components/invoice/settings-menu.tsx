"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
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
import { useAction } from "next-safe-action/hooks";
import { useFormContext } from "react-hook-form";
import { SelectCurrency } from "../select-currency";

const dateFormats = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
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
    key: "date_format",
  },
  {
    icon: Icons.CropFree,
    label: "Invoice size",
    options: invoiceSizes,
    key: "size",
  },
  {
    icon: Icons.Tax,
    label: "Sales Tax",
    options: booleanOptions,
    key: "include_tax",
  },
  {
    icon: Icons.Vat,
    label: "VAT",
    options: booleanOptions,
    key: "include_vat",
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
    label: "Discount",
    options: booleanOptions,
    key: "include_discount",
  },
  {
    icon: Icons.Straighten,
    label: "Units",
    options: booleanOptions,
    key: "include_units",
  },
  {
    icon: Icons.Decimals,
    label: "Decimals",
    options: booleanOptions,
    key: "include_decimals",
  },
  {
    icon: Icons.QrCode,
    label: "QR Code",
    options: booleanOptions,
    key: "include_qr",
  },
];

export function SettingsMenu() {
  const { watch, setValue } = useFormContext();
  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

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
                      updateInvoiceTemplate.execute({
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

                        updateInvoiceTemplate.execute({
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
