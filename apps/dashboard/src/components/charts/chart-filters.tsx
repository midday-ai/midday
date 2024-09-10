"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { parseAsString, useQueryStates } from "nuqs";

type Props = {
  currencies: {
    id: string;
    name: string;
  }[];
};

export function ChartFilters({ currencies }: Props) {
  const [{ currency }, setCurrency] = useQueryStates(
    {
      currency: parseAsString,
    },
    {
      shallow: false,
    },
  );

  const allCurrencies = [
    {
      id: "base",
      name: "Base currency",
    },
    ...currencies,
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Filter size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={10} align="end" className="w-[200px]">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icons.Currency className="mr-2 h-4 w-4" />
            <span>Currency</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent sideOffset={14} alignOffset={-4}>
              <DropdownMenuRadioGroup
                value={currency ?? "base"}
                onValueChange={(value) =>
                  setCurrency({ currency: value === "base" ? null : value })
                }
              >
                {allCurrencies.map((currency) => (
                  <DropdownMenuRadioItem key={currency.id} value={currency.id}>
                    {currency.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
