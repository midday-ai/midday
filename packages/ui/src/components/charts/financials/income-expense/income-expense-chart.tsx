import { FinancialMetricsScatterPlotConverter } from "../../../../lib/converters/expense-and-income-metrics-converter";
import { ExpenseMetrics, IncomeMetrics } from "client-typescript-sdk";
import React, { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";

import { CaretDownIcon } from "@radix-ui/react-icons";
import { AreaChart } from "../../base/area-chart";
import { BarChart } from "../../base/bar-chart";
import { ScatterChart } from "../../base/scatter-chart";

type FinancialMetrics = IncomeMetrics | ExpenseMetrics;

export interface IncomeExpenseChartProps {
  data: FinancialMetrics[];
  type: "income" | "expense";
  height?: number;
  width?: number;
  currency: string;
  locale?: string;
  enableAssistantMode?: boolean;
  enableDrillDown?: boolean;
}

const chartTypes = [
  "txnCountVsMonth",
  "txnCountVsTotalAmount",
  "totalAmountVsMonth",
  "totalAmountVsCategory",
  "txnCountVsCategory",
  "aggregatedTotalAmountVsCategory",
  "aggregatedTxnCountVsCategory",
] as const;

// type ChartType = typeof chartTypes[number];
interface ChartTypeInfo {
  label: string;
  value: string;
  description: string;
}

export const CHART_TYPES: ChartTypeInfo[] = [
  {
    label: "Transaction Count vs Month",
    value: "txnCountVsMonth",
    description: "Shows how the number of transactions changes over time",
  },
  {
    label: "Transaction Count vs Total Amount",
    value: "txnCountVsTotalAmount",
    description: "Compares the number of transactions to the total amount",
  },
  {
    label: "Total Amount vs Month",
    value: "totalAmountVsMonth",
    description: "Displays the total amount trend over time",
  },
  {
    label: "Total Amount by Category",
    value: "totalAmountVsCategory",
    description: "Breaks down total amount across different categories",
  },
  {
    label: "Transaction Count by Category",
    value: "txnCountVsCategory",
    description: "Shows the number of transactions for each category",
  },
  {
    label: "Aggregated Total Amount by Category",
    value: "aggregatedTotalAmountVsCategory",
    description: "Displays the average total amount for each category",
  },
  {
    label: "Aggregated Transaction Count by Category",
    value: "aggregatedTxnCountVsCategory",
    description: "Shows the average number of transactions for each category",
  },
];

export type ChartType = (typeof CHART_TYPES)[number]["value"];

export function getChartTypeLabel(value: ChartType): string {
  const chartType = CHART_TYPES.find((type) => type.value === value);
  return chartType ? chartType.label : value;
}

export function getChartTypeDescription(value: ChartType): string {
  const chartType = CHART_TYPES.find((type) => type.value === value);
  return chartType ? chartType.description : "";
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  data,
  type,
  height = 400,
  width = 600,
  currency,
  locale,
  enableAssistantMode,
  enableDrillDown,
}) => {
  const [selectedChart, setSelectedChart] =
    useState<ChartType>("txnCountVsMonth");

  const chartData = useMemo(() => {
    switch (selectedChart) {
      case "txnCountVsMonth":
        return FinancialMetricsScatterPlotConverter.txnCountVsMonth(data, type);
      case "txnCountVsTotalAmount":
        return FinancialMetricsScatterPlotConverter.txnCountVsTotalAmount(
          data,
          type,
        );
      case "totalAmountVsMonth":
        return FinancialMetricsScatterPlotConverter.totalAmountVsMonth(
          data,
          type,
        );
      case "totalAmountVsCategory":
        return FinancialMetricsScatterPlotConverter.totalAmountVsCategory(
          data,
          type,
        );
      case "txnCountVsCategory":
        return FinancialMetricsScatterPlotConverter.txnCountVsCategory(
          data,
          type,
        );
      case "aggregatedTotalAmountVsCategory":
        return FinancialMetricsScatterPlotConverter.aggregatedTotalAmountVsCategory(
          data,
          type,
        );
      case "aggregatedTxnCountVsCategory":
        return FinancialMetricsScatterPlotConverter.aggregatedTxnCountVsCategory(
          data,
          type,
        );
      default:
        return [];
    }
  }, [data, type, selectedChart]);

  const getAxisLabels = (): { xLabel: string; yLabel: string } => {
    switch (selectedChart) {
      case "txnCountVsMonth":
        return { xLabel: "Month", yLabel: "Transaction Count" };
      case "txnCountVsTotalAmount":
        return {
          xLabel: `Total ${type === "income" ? "Income" : "Expenses"}`,
          yLabel: "Transaction Count",
        };
      case "totalAmountVsMonth":
        return {
          xLabel: "Month",
          yLabel: `Total ${type === "income" ? "Income" : "Expenses"}`,
        };
      case "totalAmountVsCategory":
      case "aggregatedTotalAmountVsCategory":
        return {
          xLabel: "Category",
          yLabel: `Total ${type === "income" ? "Income" : "Expenses"}`,
        };
      case "txnCountVsCategory":
      case "aggregatedTxnCountVsCategory":
        return { xLabel: "Category", yLabel: "Transaction Count" };
      default:
        return { xLabel: "X Axis", yLabel: "Y Axis" };
    }
  };

  const { xLabel, yLabel } = getAxisLabels();

  const txnCountvsMonthBarData = useMemo(() => {
    return FinancialMetricsScatterPlotConverter.txnCountVsMonthChartDataPoint(
      data,
      type,
    );
  }, [data, type]);

  const totalAmountvsMonthBarData = useMemo(() => {
    return FinancialMetricsScatterPlotConverter.totalAmountVsMonthChartDataPoint(
      data,
      type,
    );
  }, [data, type]);

  return (
    <div>
      <Select
        onValueChange={(value) => setSelectedChart(value as ChartType)}
        value={selectedChart}
      >
        <SelectTrigger className="mb-4 w-fit">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {chartTypes.map((category) => (
            <SelectItem key={category} value={category}>
              {getChartTypeLabel(category)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        <p className="text-lg font-bold md:text-2xl">
          {getChartTypeLabel(selectedChart)}
        </p>
        <ScatterChart
          currency={currency}
          data={chartData}
          height={height}
          locale={locale}
          enableAssistantMode={enableAssistantMode}
          xUNit=""
          yUnit={currency}
        />
        <p className="font-base text-sm">
          {getChartTypeDescription(selectedChart)}
        </p>
      </div>

      {enableDrillDown && (
        <div className="grid gap-2 py-[2%] md:grid-cols-1">
          <div className="border-none shadow-none">
            <p className="text-lg font-bold md:text-2xl">
              Transaction Count vs. {xLabel}
            </p>
            <AreaChart
              currency={currency}
              data={txnCountvsMonthBarData}
              height={height}
              locale={locale}
              enableAssistantMode={enableAssistantMode}
            />
          </div>
          <div className="border-none shadow-none">
            <p className="text-lg font-bold md:text-2xl">
              Total Amount vs. {xLabel}
            </p>
            <AreaChart
              currency={currency}
              data={totalAmountvsMonthBarData}
              height={height}
              locale={locale}
              enableAssistantMode={enableAssistantMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};
