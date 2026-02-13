"use client";

import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { BurnRateChart } from "@/components/charts/burn-rate-chart";
import { formatChartMonth } from "@/components/charts/chart-utils";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
import { ShareMetricButton } from "../components/share-metric-button";

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
  currency,
  locale,
  isCustomizing,
  wiggleClass,
}: BurnRateCardProps) {
  const trpc = useTRPC();
  const { isCustomizing: metricsIsCustomizing, setIsCustomizing } =
    useMetricsCustomize();
  const setInput = useChatStore((state) => state.setInput);
  const [isSelecting, setIsSelecting] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setIsCustomizing(true),
    threshold: 500,
    disabled: metricsIsCustomizing || isSelecting,
  });

  const { data: burnRateData } = useQuery(
    trpc.reports.burnRate.queryOptions({
      from,
      to,
      currency: currency,
    }),
  );

  // Transform burn rate data
  const burnRateChartData = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return [];

    const values = burnRateData.map((item) => item.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    const totalMonths = burnRateData.length;

    return burnRateData.map((item) => ({
      month: formatChartMonth(item.date, totalMonths),
      amount: item.value,
      average,
      currentBurn: item.value,
      averageBurn: average,
    }));
  }, [burnRateData]);

  const averageBurnRate = useMemo(() => {
    if (!burnRateData || burnRateData.length === 0) return 0;
    const values = burnRateData.map((item) => item.value);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [burnRateData]);

  return (
    <div
      className={cn(
        "border bg-background border-border p-6 flex flex-col h-full relative group",
        !metricsIsCustomizing && "cursor-pointer",
      )}
      {...longPressHandlers}
    >
      <div className="mb-4 min-h-[140px]">
        <div className="flex items-start justify-between h-7">
          <h3 className="text-sm font-normal text-muted-foreground">
            Average Monthly Burn Rate
          </h3>
          <div className="opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="burn_rate"
              from={from}
              to={to}
              currency={currency}
            />
          </div>
        </div>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={averageBurnRate}
            currency={currency || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-foreground" />
            <span className="text-xs text-muted-foreground">Monthly</span>
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
          enableSelection={true}
          onSelectionStateChange={setIsSelecting}
          onSelectionComplete={(startDate, endDate, chartType) => {
            const message = generateChartSelectionMessage(
              startDate,
              endDate,
              chartType,
            );
            setInput(message);
          }}
        />
      </div>
    </div>
  );
}
