"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { ProfitChart } from "@/components/charts/profit-chart";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";

interface ProfitCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function ProfitCard({
  from,
  to,
  currency = "USD",
  locale,
  isCustomizing,
  wiggleClass,
}: ProfitCardProps) {
  const trpc = useTRPC();
  const [revenueType, setRevenueType] = useState<"net" | "gross">("net");

  const { data: profitData } = useQuery(
    trpc.reports.profit.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
  );

  // Transform profit data
  const profitChartData = useMemo(() => {
    if (!profitData?.result || profitData.result.length === 0) return [];

    const currentValues = profitData.result.map((item) => item.current.value);
    const average =
      currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;

    return profitData.result.map((item) => ({
      month: format(new Date(item.current.date), "MMM"),
      profit: item.current.value,
      lastYearProfit: item.previous.value,
      average,
    }));
  }, [profitData]);

  const totalProfit = profitData?.summary?.currentTotal ?? 0;

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-normal text-muted-foreground font-serif">
            Profit & Loss
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs border border-border"
              >
                {revenueType === "net" ? "Net" : "Gross"}
                <Icons.ChevronDown size={12} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={revenueType}
                onValueChange={(value) =>
                  setRevenueType(value as "net" | "gross")
                }
              >
                <DropdownMenuRadioItem value="net">
                  Net Profit (ex tax)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="gross">
                  Gross Profit (inc tax)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={totalProfit}
            currency={currency}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{dateRangeDisplay}</p>
      </div>
      <div className="h-80">
        <ProfitChart
          data={profitChartData}
          height={320}
          currency={currency}
          locale={locale}
        />
      </div>
    </div>
  );
}
