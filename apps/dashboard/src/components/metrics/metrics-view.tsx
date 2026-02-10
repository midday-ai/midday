"use client";

import { useMemo, useRef } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useUserQuery } from "@/hooks/use-user";
import { BurnRateCard } from "./cards/burn-rate-card";
import { CategoryExpensesCard } from "./cards/category-expenses-card";
import { ExpensesCard } from "./cards/expenses-card";
import { MonthlyRevenueCard } from "./cards/monthly-revenue-card";
import { ProfitCard } from "./cards/profit-card";
import { RevenueForecastCard } from "./cards/revenue-forecast-card";
import { RunwayCard } from "./cards/runway-card";
import { MetricsGrid } from "./components/metrics-grid";
import { SortableChartCard } from "./components/sortable-chart-card";
import { type ChartId, DEFAULT_CHART_ORDER } from "./utils/chart-types";

export function MetricsView() {
  const { data: user } = useUserQuery();
  const { from, to, currency, revenueType } = useMetricsFilter();
  const { isCustomizing, setIsCustomizing } = useMetricsCustomize();
  const [chartOrder, setChartOrder] = useLocalStorage<ChartId[]>(
    "metrics-chart-order",
    DEFAULT_CHART_ORDER,
  );
  const gridRef = useRef<HTMLDivElement>(null!);

  const locale = user?.locale ?? undefined;

  // Ensure all charts are in the order (handle new charts being added)
  const orderedCharts = useMemo(() => {
    const orderSet = new Set(chartOrder);
    const missing = DEFAULT_CHART_ORDER.filter((id) => !orderSet.has(id));
    return [...chartOrder, ...missing];
  }, [chartOrder]);

  useOnClickOutside(gridRef, (event) => {
    if (isCustomizing) {
      const target = event.target as Element;
      if (!target.closest("[data-no-close]")) {
        setIsCustomizing(false);
      }
    }
  });

  // Get wiggle class for customize mode
  const getWiggleClass = (index: number) => {
    if (!isCustomizing) return "";
    const wiggleIndex = (index % 7) + 1;
    return `wiggle-${wiggleIndex}`;
  };

  // Chart component mapping
  const renderChart = (chartId: ChartId, index: number) => {
    const wiggleClass = getWiggleClass(index);
    const commonProps = {
      from,
      to,
      currency,
      locale,
      isCustomizing,
      wiggleClass,
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
        default:
          return null;
      }
    })();

    if (isCustomizing) {
      return (
        <SortableChartCard
          key={chartId}
          id={chartId}
          className={isCustomizing ? "cursor-grab active:cursor-grabbing" : ""}
          customizeMode={isCustomizing}
          wiggleClass={wiggleClass}
        >
          {chartContent}
        </SortableChartCard>
      );
    }

    return <div key={chartId}>{chartContent}</div>;
  };

  return (
    <div className="flex flex-col gap-6" ref={gridRef}>
      <MetricsGrid
        orderedCharts={orderedCharts}
        isCustomizing={isCustomizing}
        onChartOrderChange={setChartOrder}
        renderChart={renderChart}
        getWiggleClass={getWiggleClass}
      />
    </div>
  );
}
