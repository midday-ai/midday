import { AccountBalanceHistory } from "client-typescript-sdk";
import React, { useMemo } from "react";
import { AccountBalanceConverter } from "../../../../lib/converters/account-balancer-converter";

import { cn } from "../../../../utils/cn";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../card";

import { AnalyticsChart } from "../../base/analytics-chart";

export interface AccountBalanceChartProps {
  currency: string;
  data: Array<AccountBalanceHistory>;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  className?: string;
  hideTitle?: boolean;
  hideDescription?: boolean;
}

export const AccountBalanceChart: React.FC<AccountBalanceChartProps> = ({
  currency,
  data,
  height = 290,
  locale,
  enableAssistantMode,
  className,
  hideDescription = false,
  hideTitle = false,
}) => {
  const chartData = useMemo(() => {
    return AccountBalanceConverter.convertToChartDataPoints(data);
  }, [data]);

  const barChartData = useMemo(() => {
    return chartData.map((item) => ({
      date: item.date,
      balance: Number(item.value),
    }));
  }, [chartData]);

  const dataKeys = ["balance"];

  return (
    <div className="h-full w-full">
      <CardHeader>
        {!hideTitle && (
          <CardTitle className="font-bold text-lg">
            Account Balance Over Time
          </CardTitle>
        )}
        {!hideDescription && (
          <CardDescription>
            Account balance over time in {currency}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn("p-3", className)}>
        <div className="border-none text-background shadow-none">
          <AnalyticsChart
            chartData={barChartData}
            title="Account Balance Over Time"
            description={`Account balance over time in ${currency}`}
            dataKeys={["balance"] as const}
            colors={["#333"]}
            trendKey="balance"
            chartType="area"
            currency={currency}
            height={height}
            locale={locale}
            enableAssistantMode={enableAssistantMode}
          />
        </div>
      </CardContent>
    </div>
  );
};
