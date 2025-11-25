"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { BurnRateChart } from "@/components/charts/burn-rate-chart";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";

interface BurnRateCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function BurnRateCard({
  from,
  to,
  currency = "USD",
  locale,
  isCustomizing,
  wiggleClass,
}: BurnRateCardProps) {
  const trpc = useTRPC();

  const { data: burnRateData } = useQuery(
    trpc.reports.burnRate.queryOptions({
      from,
      to,
      currency,
    }),
  );

  // Transform burn rate data
  const burnRateChartData = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return [];

    const values = burnRateData.map((item) => item.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    return burnRateData.map((item) => ({
      month: format(new Date(item.date), "MMM"),
      amount: item.value,
      average,
      currentBurn: item.value,
      averageBurn: average,
    }));
  }, [burnRateData]);

  const currentBurnRate = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return 0;
    return burnRateData[burnRateData.length - 1]!.value;
  }, [burnRateData]);

  return (
    <div className="border bg-background border-border p-6 flex flex-col h-full">
      <div className="mb-4 min-h-[140px]">
        <h3 className="text-sm font-normal mb-1 text-muted-foreground">
          Monthly Burn Rate
        </h3>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={currentBurnRate}
            currency={currency}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-foreground" />
            <span className="text-xs text-muted-foreground">Current</span>
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
        <BurnRateChart
          data={burnRateChartData}
          height={320}
          currency={currency}
          locale={locale}
        />
      </div>
    </div>
  );
}
