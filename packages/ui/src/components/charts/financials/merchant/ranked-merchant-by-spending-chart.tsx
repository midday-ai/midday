import React, { useMemo } from "react";
import { MerchantFinancialMetricsConverter } from "../../../../lib/converters/merchant-sub-profile-converter";
import { SpendingPeriod } from "../../../../types/merchant";
import { MerchantMetricsFinancialSubProfile } from "client-typescript-sdk";

import { ScatterChart, ScatterChartProps } from "../../base/scatter-chart";

export interface RankedMerchantsBySpendingChartProps
  extends Omit<ScatterChartProps, "data"> {
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<MerchantMetricsFinancialSubProfile>;
}

export const RankedMerchantsBySpendingChart: React.FC<
  RankedMerchantsBySpendingChartProps
> = ({
  xUNit,
  yUnit,
  currency,
  records,
  height,
  locale,
  enableAssistantMode,
  selectedSpendingPeriod,
}) => {
  if (!records || records.length === 0) {
    return null;
  }

  const chartData = useMemo(() => {
    const result =
      MerchantFinancialMetricsConverter.rankMerchantsBySpending(
        records,
        selectedSpendingPeriod,
      ) || [];

    // convert to ScatterChartDataPoint and then sort
    return result
      .map((merchant) => {
        return {
          x: merchant.merchant,
          y: merchant.totalSpending,
        };
      })
      .sort((a, b) => a.y - b.y);
  }, [records, selectedSpendingPeriod]);

  return (
    <ScatterChart
      currency={currency}
      data={chartData}
      height={height}
      locale={locale}
      enableAssistantMode={enableAssistantMode}
      xUNit={xUNit}
      yUnit={yUnit}
    />
  );
};
