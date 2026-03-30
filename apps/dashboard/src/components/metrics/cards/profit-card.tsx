"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { formatChartMonth } from "@/components/charts/chart-utils";
import { ProfitChart } from "@/components/charts/profit-chart";
import { useTRPC } from "@/trpc/client";
import { ChartFadeIn } from "../components/chart-loading-overlay";
import { DragIndicator } from "../components/drag-indicator";
import { ShareMetricButton } from "../components/share-metric-button";

interface ProfitCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  revenueType?: "net" | "gross";
  isCustomizing?: boolean;
}

export function ProfitCard({
  from,
  to,
  currency,
  locale,
  revenueType = "net",
  isCustomizing,
}: ProfitCardProps) {
  const trpc = useTRPC();

  const { data: profitData } = useQuery(
    trpc.reports.profit.queryOptions({
      from,
      to,
      currency: currency,
      revenueType,
    }),
  );

  // Transform profit data
  const profitChartData = useMemo(() => {
    if (!profitData?.result || profitData.result.length === 0) return [];

    const currentValues = profitData.result.map((item) => item.current.value);
    const average =
      currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;

    const totalMonths = profitData.result.length;

    return profitData.result.map((item) => ({
      month: formatChartMonth(item.current.date, totalMonths),
      profit: item.current.value,
      lastYearProfit: item.previous.value,
      average,
    }));
  }, [profitData]);

  const totalProfit = profitData?.summary?.currentTotal ?? 0;

  const dateRangeDisplay = useMemo(() => {
    try {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [from, to]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full relative group">
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">
            Profit & Loss
          </h3>
          <div
            className={
              isCustomizing
                ? "flex items-center gap-2"
                : "flex items-center gap-2 opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity"
            }
          >
            {isCustomizing ? (
              <DragIndicator />
            ) : (
              <ShareMetricButton
                type="profit"
                from={from}
                to={to}
                currency={currency}
              />
            )}
          </div>
        </div>
        <p className="text-3xl font-normal">
          <AnimatedNumber
            value={totalProfit}
            currency={currency || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{dateRangeDisplay}</p>
      </div>
      <div className="h-80">
        {profitChartData.length > 0 ? (
          <ChartFadeIn>
            <ProfitChart
              data={profitChartData}
              height={320}
              currency={currency}
              locale={locale}
            />
          </ChartFadeIn>
        ) : null}
      </div>
    </div>
  );
}
