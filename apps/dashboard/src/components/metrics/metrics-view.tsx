"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMetricsParams } from "@/hooks/use-metrics-params";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useMemo, useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { BurnRateCard } from "./cards/burn-rate-card";
import { CategoryExpensesCard } from "./cards/category-expenses-card";
import { ExpensesCard } from "./cards/expenses-card";
import { MonthlyRevenueCard } from "./cards/monthly-revenue-card";
import { ProfitCard } from "./cards/profit-card";
import { RevenueForecastCard } from "./cards/revenue-forecast-card";
import { RunwayCard } from "./cards/runway-card";
import { MetricsGrid } from "./components/metrics-grid";
import { MetricsHeader } from "./components/metrics-header";
import { SortableChartCard } from "./components/sortable-chart-card";
import { type ChartId, DEFAULT_CHART_ORDER } from "./utils/chart-types";

export function MetricsView() {
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const { from, to, setParams } = useMetricsParams();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [chartOrder, setChartOrder] = useLocalStorage<ChartId[]>(
    "metrics-chart-order",
    DEFAULT_CHART_ORDER,
  );
  const gridRef = useRef<HTMLDivElement>(null!);

  const currency = team?.baseCurrency ?? undefined;
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

  const handleDateRangeChange = (newFrom: string, newTo: string) => {
    setParams({
      from: newFrom,
      to: newTo,
    });
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
      <MetricsHeader
        from={from}
        to={to}
        fiscalYearStartMonth={team?.fiscalYearStartMonth}
        isCustomizing={isCustomizing}
        onCustomizeToggle={() => setIsCustomizing(!isCustomizing)}
        onDateRangeChange={handleDateRangeChange}
      />

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
