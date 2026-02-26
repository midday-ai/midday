"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { CollectionPerformanceChart } from "@/components/charts/collection-performance-chart";
import { useLongPress } from "@/hooks/use-long-press";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useChatStore } from "@/store/chat";
import { useTRPC } from "@/trpc/client";
import { generateChartSelectionMessage } from "@/utils/chart-selection-message";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { ShareMetricButton } from "../components/share-metric-button";

interface CollectionPerformanceCardProps {
  from: string;
  to: string;
  currency?: string;
  locale?: string;
  isCustomizing: boolean;
  wiggleClass?: string;
}

export function CollectionPerformanceCard({
  from,
  to,
  currency,
  locale,
  isCustomizing,
  wiggleClass,
}: CollectionPerformanceCardProps) {
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
    trpc.reports.collectionPerformance.queryOptions({
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
    return data?.summary?.totalCollected ?? 0;
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
            Collection Performance
          </h3>
          <div className="opacity-0 group-hover:opacity-100 group-has-[*[data-state=open]]:opacity-100 transition-opacity">
            <ShareMetricButton
              type="collection_performance"
              from={from}
              to={to}
              currency={currency}
            />
          </div>
        </div>
        <p className="text-3xl font-normal mb-3">
          <AnimatedNumber
            value={heroKpi}
            currency={currency || "USD"}
            locale={locale}
            maximumFractionDigits={0}
          />
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2" style={{ backgroundColor: "#0ea5e9" }} />
            <span className="text-xs text-muted-foreground">Collected</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">Expected</span>
          </div>
          <div className="flex gap-2 items-center">
            <div
              className="w-4 h-0.5"
              style={{
                borderTop: "2px dashed hsl(var(--muted-foreground))",
              }}
            />
            <span className="text-xs text-muted-foreground">Rate %</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <CollectionPerformanceChart
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
