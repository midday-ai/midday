import React, { useMemo } from "react";
import { LocationFinancialMetricsConverter } from "../../../../lib/converters/location-sub-profile-converter";
import { SpendingPeriod } from "../../../../types/merchant";
import { LocationFinancialSubProfile } from "client-typescript-sdk";

import { ScatterChart, ScatterChartProps } from "../../base/scatter-chart";

export interface RankedLocationsBySpendingChartProps
  extends Omit<ScatterChartProps, "data"> {
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<LocationFinancialSubProfile>;
}

export const RankedLocationsBySpendingChart: React.FC<
  RankedLocationsBySpendingChartProps
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
      LocationFinancialMetricsConverter.rankCitiesBySpending(
        records,
        selectedSpendingPeriod,
      ) || [];

    // convert to ScatterChartDataPoint and then sort
    return result
      .map((location) => {
        return {
          x: location.city,
          y: location.totalSpending,
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
