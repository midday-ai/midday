import { MerchantMetricsFinancialSubProfile } from "client-typescript-sdk";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MerchantFinancialMetricsConverter } from "../../../../lib/converters/merchant-sub-profile-converter";
import { SpendingPeriod } from "../../../../types/merchant";

export interface TopMerchantChartProps {
  merchants: Array<string>;
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<MerchantMetricsFinancialSubProfile>;
}

export const TopMerchantChart: React.FC<TopMerchantChartProps> = ({
  selectedSpendingPeriod,
  merchants,
  records,
}) => {
  const chartData = useMemo(() => {
    return MerchantFinancialMetricsConverter.identifyTopPerformingMerchants(
      records,
      selectedSpendingPeriod,
      5,
    );
  }, [records, selectedSpendingPeriod]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          className="rounded-md border"
          barGap={15}
          data={chartData}
          margin={{
            top: 30,
            right: 30,
            left: 30,
            bottom: 30,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            horizontal={false}
            className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
          />
          <XAxis
            dataKey="merchant"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={15}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="recentGrowthRate"
            fill="hsl(var(--primary))"
            activeBar={<Rectangle fill="black" stroke="gray" />}
          />
          <Bar
            dataKey="totalSpending"
            fill="#41191A"
            activeBar={<Rectangle fill="black" stroke="gray" />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
