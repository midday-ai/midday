"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface MetricsSettingsProps {
  baseCurrency?: string;
  selectedCurrency: string | null;
  onCurrencyChange: (currency: string | null) => void;
}

export function MetricsSettings({
  baseCurrency,
  selectedCurrency,
  onCurrencyChange,
}: MetricsSettingsProps) {
  const trpc = useTRPC();
  const { data: currencies } = useQuery(
    trpc.bankAccounts.currencies.queryOptions(),
  );

  // Get unique currencies from bank accounts
  const uniqueCurrencies = currencies
    ? [...new Set(currencies.map((c) => c.currency))].sort()
    : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Tune className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={10}>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Currency
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={selectedCurrency ?? "base"}
          onValueChange={(value) => {
            onCurrencyChange(value === "base" ? null : value);
          }}
        >
          <DropdownMenuRadioItem value="base">
            Base currency{baseCurrency ? ` (${baseCurrency})` : ""}
          </DropdownMenuRadioItem>
          {uniqueCurrencies.map((currency) => (
            <DropdownMenuRadioItem key={currency} value={currency}>
              {currency}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
