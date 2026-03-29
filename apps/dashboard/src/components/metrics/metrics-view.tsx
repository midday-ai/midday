"use client";

import { Button } from "@midday/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updateMetricsSettingsAction } from "@/actions/update-metrics-settings-action";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { BurnRateCard } from "./cards/burn-rate-card";
import { CashBalanceCard } from "./cards/cash-balance-card";
import { CategoryExpensesCard } from "./cards/category-expenses-card";
import { ExpensesCard } from "./cards/expenses-card";
import { MonthlyRevenueCard } from "./cards/monthly-revenue-card";
import { ProfitCard } from "./cards/profit-card";
import { RevenueForecastCard } from "./cards/revenue-forecast-card";
import { RunwayCard } from "./cards/runway-card";
import { DraggableChartCard } from "./components/draggable-chart-card";
import { MetricsGrid } from "./components/metrics-grid";
import {
  type ChartId,
  type ChartLayoutItem,
  type ColSpan,
  DEFAULT_CHART_LAYOUT,
  DEFAULT_CHART_ORDER,
} from "./utils/chart-types";

const ORDERED_SPANS: ColSpan[] = [4, 6, 8, 12];

function closestSpan(n: number): ColSpan {
  let best: ColSpan = 4;
  let bestDist = Math.abs(n - 4);
  for (const s of ORDERED_SPANS) {
    const d = Math.abs(n - s);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

function largestSpanFitting(max: number): ColSpan {
  for (let i = ORDERED_SPANS.length - 1; i >= 0; i--) {
    if (ORDERED_SPANS[i]! <= max) return ORDERED_SPANS[i]!;
  }
  return 4;
}

function fillRowGap(
  items: ChartLayoutItem[],
  start: number,
  end: number,
  rowTotal: number,
  protectedId?: ChartId,
) {
  if (rowTotal >= 12) return;
  const gap = 12 - rowTotal;
  for (let j = end; j >= start; j--) {
    if (items[j]!.id !== protectedId) {
      items[j]!.colSpan = closestSpan(items[j]!.colSpan + gap);
      return;
    }
  }
}

function normalizeRows(
  layout: ChartLayoutItem[],
  protectedId?: ChartId,
): ChartLayoutItem[] {
  const result: ChartLayoutItem[] = layout.map((item) => ({ ...item }));

  let rowStart = 0;
  let rowTotal = 0;

  for (let i = 0; i < result.length; i++) {
    const item = result[i]!;

    if (rowTotal + item.colSpan > 12) {
      const remaining = 12 - rowTotal;

      if (remaining >= 4 && item.id !== protectedId) {
        item.colSpan = largestSpanFitting(remaining);
        rowTotal += item.colSpan;
      } else {
        fillRowGap(result, rowStart, i - 1, rowTotal, protectedId);
        rowStart = i;
        rowTotal = item.colSpan;
      }
    } else {
      rowTotal += item.colSpan;
    }

    if (rowTotal >= 12) {
      rowStart = i + 1;
      rowTotal = 0;
    }
  }

  fillRowGap(result, rowStart, result.length - 1, rowTotal, protectedId);

  return result;
}

interface MetricsViewProps {
  initialLayout?: ChartLayoutItem[];
  isEditing?: boolean;
}

export function MetricsView({
  initialLayout,
  isEditing = false,
}: MetricsViewProps) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { data: connections } = useQuery(
    trpc.bankConnections.get.queryOptions(),
  );
  const { from, to, currency, revenueType } = useMetricsFilter();
  const [layout, setLayout] = useState<ChartLayoutItem[]>(
    initialLayout ?? DEFAULT_CHART_LAYOUT,
  );

  const handleLayoutChange = useCallback((newLayout: ChartLayoutItem[]) => {
    const normalized = normalizeRows(newLayout);
    setLayout(normalized);
    updateMetricsSettingsAction(normalized);
  }, []);

  const handleResizeChart = useCallback(
    (chartId: ChartId, newColSpan: ColSpan) => {
      setLayout((prev) => {
        const updated = prev.map((item) =>
          item.id === chartId ? { ...item, colSpan: newColSpan } : item,
        );
        const newLayout = normalizeRows(updated, chartId);
        updateMetricsSettingsAction(newLayout);
        return newLayout;
      });
    },
    [],
  );

  const gridRef = useRef<HTMLDivElement>(null!);

  const locale = user?.locale ?? undefined;

  const normalizedLayout = useMemo(() => {
    const seen = new Set(layout.map((item) => item.id));
    const missing = DEFAULT_CHART_ORDER.filter((id) => !seen.has(id));
    const defaultSpans = new Map(
      DEFAULT_CHART_LAYOUT.map((item) => [item.id, item.colSpan]),
    );
    return [
      ...layout,
      ...missing.map((id) => ({
        id,
        colSpan: defaultSpans.get(id) ?? (6 as ColSpan),
      })),
    ];
  }, [layout]);

  const [_, setStep] = useQueryState("step");
  const hasConnections = connections && connections.length > 0;
  const showConnectOverlay = connections !== undefined && !hasConnections;

  const renderChart = (chartId: ChartId, index: number) => {
    const commonProps = {
      from,
      to,
      currency,
      locale,
      isCustomizing: isEditing,
      revenueType,
    };

    const chartContent = (() => {
      switch (chartId) {
        case "monthly-revenue":
          return <MonthlyRevenueCard {...commonProps} />;
        case "burn-rate":
          return <BurnRateCard {...commonProps} />;
        case "expenses":
          return <ExpensesCard {...commonProps} />;
        case "profit":
          return <ProfitCard {...commonProps} />;
        case "revenue-forecast":
          return <RevenueForecastCard {...commonProps} />;
        case "runway":
          return <RunwayCard {...commonProps} />;
        case "category-expenses":
          return <CategoryExpensesCard {...commonProps} />;
        case "cash-balance":
          return (
            <CashBalanceCard
              currency={currency}
              locale={locale}
              isCustomizing={isEditing}
            />
          );
        default:
          return null;
      }
    })();

    return (
      <DraggableChartCard
        key={chartId}
        id={chartId}
        isEditing={isEditing}
        onResize={(newColSpan) => handleResizeChart(chartId, newColSpan)}
      >
        {showConnectOverlay ? (
          <div
            className="relative overflow-hidden group/connect cursor-pointer border border-border bg-background"
            onClick={() => setStep("connect")}
            onKeyDown={(e) => e.key === "Enter" && setStep("connect")}
            role="button"
            tabIndex={0}
          >
            <div className="transition-all duration-200 group-hover/connect:blur-[7px] group-hover/connect:opacity-20 group-hover/connect:pointer-events-none group-hover/connect:select-none [&>*]:border-0">
              {chartContent}
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 pointer-events-none group-hover/connect:opacity-100 transition-opacity duration-200">
              <div className="text-center flex flex-col items-center">
                <h2 className="text-lg font-medium mb-2">No data available</h2>
                <p className="text-sm text-[#878787] mb-4">
                  Connect your bank account to unlock this metric.
                </p>
                <Button>Connect Bank</Button>
              </div>
            </div>
          </div>
        ) : (
          chartContent
        )}
      </DraggableChartCard>
    );
  };

  const searchParams = useSearchParams();
  const scrollTo = searchParams.get("scrollTo");

  useEffect(() => {
    if (!scrollTo) return;

    let attempts = 0;
    const maxAttempts = 15;

    const tryScroll = () => {
      const el = document.getElementById(scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryScroll, 100);
      }
    };

    tryScroll();
  }, [scrollTo]);

  return (
    <div className="flex flex-col gap-6" ref={gridRef}>
      <MetricsGrid
        layout={normalizedLayout}
        onLayoutChange={handleLayoutChange}
        renderChart={renderChart}
        isEditing={isEditing}
      />
    </div>
  );
}
