"use client";

import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
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

interface MonthlyRevenueCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function MonthlyRevenueCard({
  from,
  to,
  currency = "USD",
  locale,
  isCustomizing,
  wiggleClass,
}: MonthlyRevenueCardProps) {
  const trpc = useTRPC();
  const [revenueType, setRevenueType] = useState<"net" | "gross">("net");

  const { data: revenueData } = useQuery(
    trpc.reports.revenue.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
  );

  // Transform revenue data
  const monthlyRevenueChartData = useMemo(() => {
    if (!revenueData?.result || revenueData.result.length === 0) return [];

    const values = revenueData.result.map((item) => item.current.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return revenueData.result.map((item) => ({
      month: format(new Date(item.date), "MMM"),
      amount: item.current.value,
      lastYearAmount: item.previous.value,
      average,
      currentRevenue: item.current.value,
      lastYearRevenue: item.previous.value,
      averageRevenue: average,
    }));
  }, [revenueData]);

  const currentRevenue = useMemo(() => {
    if (!revenueData?.result || revenueData.result.length === 0) return 0;
    return revenueData.result[revenueData.result.length - 1]!.current.value;
  }, [revenueData]);

  return (
    <div className="border bg-background border-border p-6">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-normal text-muted-foreground">
            Monthly Revenue
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                {revenueType === "net" ? "Net" : "Gross"}
                <Icons.ChevronDown size={12} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuRadioGroup
                value={revenueType}
                onValueChange={(value) =>
                  setRevenueType(value as "net" | "gross")
                }
              >
                <DropdownMenuRadioItem value="net">Net</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="gross">
                  Gross
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-3xl font-normal mb-3">
          {formatAmount({
            amount: currentRevenue,
            currency,
            locale,
            maximumFractionDigits: 0,
          })}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-foreground" />
            <span className="text-xs text-muted-foreground">This Year</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-2 h-2"
              style={{
                backgroundColor: "var(--chart-bar-fill-secondary)",
              }}
            />
            <span className="text-xs text-muted-foreground">Last Year</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-4 h-0.5"
              style={{
                borderTop: "2px dashed hsl(var(--muted-foreground))",
              }}
            />
            <span className="text-xs text-muted-foreground">Average</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <MonthlyRevenueChart
          data={monthlyRevenueChartData}
          height={320}
          currency={currency}
          locale={locale}
        />
      </div>
    </div>
  );
}
