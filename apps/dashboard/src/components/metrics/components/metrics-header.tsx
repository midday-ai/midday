"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MetricsDatePicker } from "./metrics-date-picker";

interface MetricsHeaderProps {
  from: string;
  to: string;
  fiscalYearStartMonth?: number | null;
  isCustomizing: boolean;
  onCustomizeToggle: () => void;
  onDateRangeChange: (from: string, to: string) => void;
}

export function MetricsHeader({
  from,
  to,
  fiscalYearStartMonth,
  isCustomizing,
  onCustomizeToggle,
  onDateRangeChange,
}: MetricsHeaderProps) {
  const trpc = useTRPC();
  const { data: currencies } = useQuery(
    trpc.bankAccounts.currencies.queryOptions(),
  );

  const hasMultipleCurrencies =
    currencies && currencies.length > 1
      ? new Set(currencies.map((c) => c.currency)).size > 1
      : false;

  return (
    <div className="flex items-center justify-between pt-6">
      <div>
        <h1 className="text-2xl font-normal mb-1 font-serif">Metrics</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Multi-Currency Alert */}
        {hasMultipleCurrencies && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Icons.Info size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="w-[280px] text-xs"
                side="bottom"
                sideOffset={10}
              >
                <p className="mb-2">
                  Since you have accounts in different currencies, we're showing
                  everything converted to your base currency so you can see the
                  full picture.
                </p>
                <Link
                  href="/settings"
                  className="text-primary hover:underline font-medium underline"
                >
                  Change base currency
                </Link>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Customize Button */}
        <Button
          variant="outline"
          className="space-x-2 px-3"
          onClick={onCustomizeToggle}
          data-no-close
        >
          <span>{isCustomizing ? "Save" : "Customize"}</span>
          {isCustomizing ? (
            <Icons.Check size={16} />
          ) : (
            <Icons.DashboardCustomize size={16} />
          )}
        </Button>

        {/* Date Range Picker */}
        <MetricsDatePicker
          from={from}
          to={to}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onDateRangeChange={onDateRangeChange}
        />
      </div>
    </div>
  );
}
