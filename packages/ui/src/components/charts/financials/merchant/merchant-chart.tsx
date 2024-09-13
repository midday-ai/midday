import { MerchantFinancialMetricsConverter } from "../../../../lib/converters/merchant-sub-profile-converter";
import { SpendingPeriod } from "../../../../types/merchant";
import {
  MerchantMetricsFinancialSubProfile
} from "client-typescript-sdk";
import React, { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";

import { MerchantSeasonalTrendsChart } from "./merchant-seasonal-trends-chart";
import { MerchantSpendingVsMonthChart } from "./merchant-spending-over-time";
import { MonthlyMerchantGrowthRateChart } from "./monthly-merchant-grow-rate";
import { RankedMerchantsBySpendingChart } from "./ranked-merchant-by-spending-chart";
import { TopMerchantChart } from "./top-merchant-chart";

export interface MerchantFinancialChartProps {
  data: MerchantMetricsFinancialSubProfile[];
  height?: number;
  width?: number;
  currency: string;
  locale?: string;
  enableAssistantMode?: boolean;
  enableDrillDown?: boolean;
}

interface MerchantChartTypeInfo {
  label: string;
  value: string;
  description: string;
}

export const MERCHANT_CHART_TYPES: MerchantChartTypeInfo[] = [
  {
    label: "Spending vs Month",
    value: "spendingVsMonth",
    description: "Shows how spending changes over time for each merchant",
  },
  {
    label: "Total Spending by Merchant",
    value: "totalSpendingByMerchant",
    description: "Compares total spending across different merchants",
  },
  {
    label: "Monthly Growth Rate",
    value: "monthlyGrowthRate",
    description: "Displays the month-over-month growth rate for each merchant",
  },
  {
    label: "Seasonal Trends",
    value: "seasonalTrends",
    description: "Breaks down spending across seasons for each merchant",
  },
  {
    label: "Top Performing Merchants",
    value: "topPerformingMerchants",
    description:
      "Shows the top performing merchants based on growth and total spending",
  },
];

export type MerchantChartType = (typeof MERCHANT_CHART_TYPES)[number]["value"];

export function getMerchantChartTypeLabel(value: MerchantChartType): string {
  const chartType = MERCHANT_CHART_TYPES.find((type) => type.value === value);
  return chartType ? chartType.label : value;
}

export function getMerchantChartTypeDescription(
  value: MerchantChartType,
): string {
  const chartType = MERCHANT_CHART_TYPES.find((type) => type.value === value);
  return chartType ? chartType.description : "";
}

export const MerchantFinancialChart: React.FC<MerchantFinancialChartProps> = ({
  data,
  height = 400,
  width = 600,
  currency,
  locale,
  enableAssistantMode,
  enableDrillDown,
}) => {
  const [selectedChart, setSelectedChart] =
    useState<MerchantChartType>("spendingVsMonth");
  const [selectedSpendingPeriod, setSelectedSpendingPeriod] =
    useState<SpendingPeriod>("spentLastMonth");

  // get unique set of merchants
  const merchants = useMemo(() => {
    return data
      .map((item) => item.merchantName)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [data]);

  // set the default selected merchant
  const [selectedMerchant, setSelectedMerchant] = useState<string>(
    merchants[0] || "",
  );

  const chartData = useMemo(() => {
    switch (selectedChart) {
      case "spendingVsMonth":
        return MerchantFinancialMetricsConverter.generateSpendingTimeSeries(
          data,
          selectedSpendingPeriod,
        );
      case "totalSpendingByMerchant":
        return MerchantFinancialMetricsConverter.rankMerchantsBySpending(
          data,
          selectedSpendingPeriod,
        );
      case "monthlyGrowthRate":
        return MerchantFinancialMetricsConverter.calculateMonthlyGrowthRate(
          data,
          selectedSpendingPeriod,
        );
      case "seasonalTrends":
        return MerchantFinancialMetricsConverter.identifySeasonalTrends(
          data,
          selectedSpendingPeriod,
        );
      case "topPerformingMerchants":
        return MerchantFinancialMetricsConverter.identifyTopPerformingMerchants(
          data,
          selectedSpendingPeriod,
          10,
        );
      default:
        return [];
    }
  }, [data, selectedChart, selectedSpendingPeriod]);

  const chartComponent = useMemo(() => {
    switch (selectedChart) {
      case "spendingVsMonth":
        return (
          <MerchantSpendingVsMonthChart
            currency={currency}
            locale={locale}
            enableAssistantMode={enableAssistantMode}
            merchants={merchants as string[]}
            selectedSpendingPeriod={selectedSpendingPeriod}
            records={data}
          />
        );

      case "totalSpendingByMerchant":
        return (
          <RankedMerchantsBySpendingChart
            currency={currency}
            locale={locale}
            enableAssistantMode={enableAssistantMode}
            selectedSpendingPeriod={selectedSpendingPeriod}
            records={data}
            xUNit={""}
            yUnit={currency}
          />
        );
      case "monthlyGrowthRate":
        return (
          <MonthlyMerchantGrowthRateChart
            currency={currency}
            locale={locale}
            enableAssistantMode={enableAssistantMode}
            merchants={merchants as string[]}
            selectedSpendingPeriod={selectedSpendingPeriod}
            records={data}
          />
        );
      case "seasonalTrends":
        return (
          <MerchantSeasonalTrendsChart
            currency={currency}
            locale={locale}
            enableAssistantMode={enableAssistantMode}
            merchants={merchants as string[]}
            selectedSpendingPeriod={selectedSpendingPeriod}
            records={data}
            xUNit={""}
            yUnit={currency}
          />
        );
      case "topPerformingMerchants":
        return (
          <TopMerchantChart
            merchants={merchants as string[]}
            selectedSpendingPeriod={selectedSpendingPeriod}
            records={data}
          />
        );
      default:
        return null;
    }
  }, [data, selectedChart, selectedSpendingPeriod]);

  const getAxisLabels = (): { xLabel: string; yLabel: string } => {
    switch (selectedChart) {
      case "spendingVsMonth":
        return { xLabel: "Month", yLabel: "Spending" };
      case "totalSpendingByMerchant":
        return { xLabel: "Merchant", yLabel: "Total Spending" };
      case "monthlyGrowthRate":
        return { xLabel: "Month", yLabel: "Growth Rate (%)" };
      case "seasonalTrends":
        return { xLabel: "Season", yLabel: "Spending" };
      case "topPerformingMerchants":
        return { xLabel: "Merchant", yLabel: "Performance Score" };
      default:
        return { xLabel: "X Axis", yLabel: "Y Axis" };
    }
  };

  const { xLabel, yLabel } = getAxisLabels();

  const topPerformingMerchants =
    MerchantFinancialMetricsConverter.identifyTopPerformingMerchants(
      data,
      selectedSpendingPeriod,
      5,
    );
  const seasonalTrends =
    MerchantFinancialMetricsConverter.identifySeasonalTrends(
      data,
      selectedSpendingPeriod,
    );

  return (
    <div className="min-w-full md:min-w-[600px]">
      <div className="flex flex-1 justify-between gap-x-[2%]">
        <Select
          onValueChange={(value) =>
            setSelectedChart(value as MerchantChartType)
          }
          value={selectedChart}
        >
          <SelectTrigger className="mb-4 w-fit">
            <SelectValue placeholder="Select a chart type" />
          </SelectTrigger>
          <SelectContent>
            {MERCHANT_CHART_TYPES.map((chartType) => (
              <SelectItem key={chartType.value} value={chartType.value}>
                {chartType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) =>
            setSelectedSpendingPeriod(value as SpendingPeriod)
          }
          value={selectedSpendingPeriod}
        >
          <SelectTrigger className="mb-4 w-fit">
            <SelectValue placeholder="Select a spending period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spentLastWeek">Last Week</SelectItem>
            <SelectItem value="spentLastTwoWeeks">Last Two Weeks</SelectItem>
            <SelectItem value="spentLastMonth">Last Month</SelectItem>
            <SelectItem value="spentLastSixMonths">Last Six Months</SelectItem>
            <SelectItem value="spentLastYear">Last Year</SelectItem>
            <SelectItem value="spentLastTwoYears">Last Two Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-lg font-bold md:text-2xl">
          {getMerchantChartTypeLabel(selectedChart)}
        </p>
        {chartComponent}
        <p className="font-base text-sm">
          {getMerchantChartTypeDescription(selectedChart)}
        </p>
      </div>
    </div>
  );
};
