import { AccountBalanceConverter } from "../../../../lib/converters/account-balancer-converter";
import {
  AccountBalanceHistory
} from "client-typescript-sdk";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../card";

import { AreaChart } from "../../base/area-chart";

export interface AccountBalanceChartProps {
  currency: string;
  data: Array<AccountBalanceHistory>;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
}

export const AccountBalanceChart: React.FC<AccountBalanceChartProps> = ({
  currency,
  data,
  height = 290,
  locale,
  enableAssistantMode,
}) => {
  const chartData = AccountBalanceConverter.convertToChartDataPoints(data);

  return (
    <div className="h-full w-full">
      <CardHeader>
        <CardTitle className="font bold text-lg">
          Account Balance Over Time
        </CardTitle>
        <CardDescription>
          Account balance over time in {currency}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="border-none text-background shadow-none">
          <AreaChart
            currency={currency}
            data={chartData}
            height={height}
            locale={locale}
            enableAssistantMode={enableAssistantMode}
          />
        </div>
      </CardContent>
    </div>
  );
};
