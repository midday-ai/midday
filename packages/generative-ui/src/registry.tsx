"use client";

import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { GenericAreaChart } from "./charts/area-chart";
import { GenericBarChart } from "./charts/bar-chart";
import { GenericDonutChart } from "./charts/donut-chart";
import { GenericLineChart } from "./charts/line-chart";
import { BalanceSheet } from "./components/balance-sheet";
import { ChartContainer } from "./components/chart-container";
import { DataTable } from "./components/data-table";
import { MetricGrid } from "./components/metric-grid";
import { Section } from "./components/section";

export const { registry } = defineRegistry(catalog, {
  components: {
    BarChart: ({ props }) => <GenericBarChart {...props} />,
    LineChart: ({ props }) => <GenericLineChart {...props} />,
    AreaChart: ({ props }) => <GenericAreaChart {...props} />,
    DonutChart: ({ props }) => <GenericDonutChart {...props} />,
    ChartContainer: ({ props, children }) => (
      <ChartContainer {...props}>{children}</ChartContainer>
    ),
    MetricGrid: ({ props }) => <MetricGrid {...props} />,
    Section: ({ props }) => <Section {...props} />,
    DataTable: ({ props }) => <DataTable {...props} />,
    BalanceSheet: ({ props }) => <BalanceSheet {...props} />,
  },
});
