"use client";

import { PortfolioCompositionChart } from "@/components/charts/portfolio-composition-chart";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";

interface PortfolioCompositionCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function PortfolioCompositionCard({
  from,
  to,
  currency,
  locale,
  isCustomizing,
  wiggleClass,
}: PortfolioCompositionCardProps) {
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

  const { data } = useQuery(
    trpc.reports.portfolioComposition.queryOptions({
      from,
      to,
      currency: currency,
    }),
  );

  const chartData = useMemo(() => {
    if (!data?.result || data.result.length === 0) return [];
    return data.result.map((item) => ({
      month: format(parseISO(item.date), "MMM"),
      ...item,
    }));
  }, [data]);

  const heroKpi = useMemo(() => {
    return data?.summary?.activeDeals ?? 0;
  }, [data]);

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
            Portfolio Composition
          </h3>
        </div>
        <span className="text-3xl font-normal mb-3">{heroKpi}</span>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2" style={{ backgroundColor: "#0ea5e9" }} />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2" style={{ backgroundColor: "#d97706" }} />
            <span className="text-xs text-muted-foreground">Late</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2" style={{ backgroundColor: "#dc2626" }} />
            <span className="text-xs text-muted-foreground">Defaulted</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2" style={{ backgroundColor: "#16a34a" }} />
            <span className="text-xs text-muted-foreground">Paid Off</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2" style={{ backgroundColor: "#9ca3af" }} />
            <span className="text-xs text-muted-foreground">Paused</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <PortfolioCompositionChart
          data={chartData}
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
