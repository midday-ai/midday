"use client";

import { uniqueCurrencies } from "@midday/location/src/currencies";
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
import { format } from "date-fns";
import { useFormContext } from "react-hook-form";

export function SettingsMenu() {
  const { watch, setValue } = useFormContext();
  const size = watch("template.size");
  const dateFormat = watch("template.date_format");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button">
          <Icons.MoreVertical className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icons.DateFormat className="mr-2 size-4" />
            <span className="text-xs">Date format</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={dateFormat === "dd/MM/yyyy"}
              onCheckedChange={() =>
                setValue("template.date_format", "dd/MM/yyyy", {
                  shouldValidate: true,
                })
              }
            >
              {format(new Date(), "dd/MM/yyyy")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={dateFormat === "MM/dd/yyyy"}
              onCheckedChange={() =>
                setValue("template.date_format", "MM/dd/yyyy", {
                  shouldValidate: true,
                })
              }
            >
              {format(new Date(), "MM/dd/yyyy")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={dateFormat === "yyyy-MM-dd"}
              onCheckedChange={() =>
                setValue("template.date_format", "yyyy-MM-dd", {
                  shouldValidate: true,
                })
              }
            >
              {format(new Date(), "yyyy-MM-dd")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icons.CropFree className="mr-2 size-4" />
            <span className="text-xs">Invoice size</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={size === "a4"}
              onCheckedChange={() => setValue("template.size", "a4")}
            >
              A4
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={size === "letter"}
              onCheckedChange={() => setValue("template.size", "letter")}
            >
              Letter
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icons.Tax className="mr-2 size-4" />
            <span className="text-xs">Add Sales Tax</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={watch("template.include_tax")}
              onCheckedChange={(checked) =>
                setValue("template.include_tax", checked)
              }
            >
              Yes
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="text-xs"
              checked={!watch("template.include_tax")}
              onCheckedChange={(checked) =>
                setValue("template.include_tax", !checked)
              }
            >
              No
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Vat className="mr-2 size-4" />
              <span className="text-xs">Add VAT</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-0">
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={watch("template.include_vat")}
                onCheckedChange={(checked) =>
                  setValue("template.include_vat", checked)
                }
              >
                Yes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="text-xs"
                checked={!watch("template.include_vat")}
                onCheckedChange={(checked) =>
                  setValue("template.include_vat", !checked)
                }
              >
                No
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CurrencyOutline className="mr-2 size-4" />
              <span className="text-xs">Currency</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-0 max-h-48 overflow-y-auto">
              {uniqueCurrencies.map((currency) => (
                <DropdownMenuCheckboxItem
                  className="text-xs"
                  key={currency}
                  checked={watch("template.currency") === currency}
                  onCheckedChange={() =>
                    setValue("template.currency", currency)
                  }
                >
                  {currency}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
