"use client";

import {
  AccountBalanceDataType,
  AccountBalanceGrowthRateDataType,
  TimeseriesDataType,
} from "@/types/analytics/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { AccountBalanceHistory } from "@solomon-ai/client-typescript-sdk";
import { TimeSeriesBarChart } from "../template/bar-chart-template";
import { TemplatizedChart } from "../template/chart-template";
import { TimeSeriesAreaChart } from "../template/timeseries-area-chart-template";
import { AccountBalanceGrowthRateChart } from "./account-balance-growth-rate-chart";
import { AccountBalanceOverviewChart } from "./account-balance-overview-chart";

interface AccountBalanceSummaryChartsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  link?: string;
  accountId?: string;
  historicalAccountBalance: Array<AccountBalanceHistory>;
}

const AccountBalanceSummaryCharts: React.FC<
  AccountBalanceSummaryChartsProps
> = ({ className, link, accountId, historicalAccountBalance }) => {
  // given the account balance history, we can calculate the balance growth rate
  // and display it in a chart
  const growthRate: Array<TimeseriesDataType> = historicalAccountBalance.map(
    (balance, index) => {
      const currentBalance = balance.balance ?? 0;
      const previousBalance =
        historicalAccountBalance[index - 1]?.balance ?? currentBalance;
      const growthRate =
        previousBalance !== 0
          ? (currentBalance - previousBalance) / previousBalance
          : 0;
      return {
        date: balance.time
          ? new Date(balance.time).toDateString()
          : new Date().toDateString(),
        value: growthRate,
      };
    },
  );

  // transform the account balance history data to the format expected by the chart
  const balanceData: Array<AccountBalanceDataType> =
    historicalAccountBalance.map((balance) => ({
      date: balance.time
        ? new Date(balance.time).toDateString()
        : new Date().toDateString(),
      balance: balance.balance ?? 0,
    }));

  const timeSeriesData: Array<TimeseriesDataType> =
    historicalAccountBalance.map((balance) => ({
      date: balance.time
        ? new Date(balance.time).toDateString()
        : new Date().toDateString(),
      value: balance.balance ?? 0,
    }));

  console.log("timeSeriesData", timeSeriesData);

  return (
    <>
      <Tabs defaultValue="balance" className={className}>
        <TabsList className="w-fit">
          <TabsTrigger value="balance" className="rounded-2xl">
            Balance
          </TabsTrigger>
          <TabsTrigger value="balance-growth-rate" className="rounded-2xl">
            Balance Growth Rate
          </TabsTrigger>
        </TabsList>
        <TabsContent value="balance">
          <TimeSeriesAreaChart
            title="Account Balance Overview Over Time"
            data={timeSeriesData}
            dataKey="value"
            valueSuffix=""
            tooltipLabel="Balance"
            chartHeights={{ mediumScreen: 600, smallScreen: 500, default: 400 }}
            gradientColors={{ startColor: "#333", endColor: "#666" }}
            className="border-none shadow-none"
          />
        </TabsContent>
        <TabsContent value="balance-growth-rate">
          <TimeSeriesBarChart
            title="Growth Revenue"
            data={growthRate}
            dataKey="value"
            valuePrefix="$"
            tooltipLabel="Revenue"
            gradientColors={{ startColor: "#333", endColor: "#666" }}
            chartHeights={{ mediumScreen: 600, smallScreen: 500, default: 400 }}
            className="border-none shadow-none"
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export { AccountBalanceSummaryCharts };
