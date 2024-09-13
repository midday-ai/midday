import React, { useMemo, useState } from "react";
import { MerchantFinancialMetricsConverter } from "../../../../lib/converters/merchant-sub-profile-converter";
import { ScatterChartDataPoint } from "../../../../types/chart";
import { SpendingPeriod } from "../../../../types/merchant";
import { MerchantMetricsFinancialSubProfile } from "client-typescript-sdk";
import { HiSquare3Stack3D } from "react-icons/hi2";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";

import { ScatterChart, ScatterChartProps } from "../../base/scatter-chart";

export interface MerchantSeasonalTrendsChartProps
  extends Omit<ScatterChartProps, "data"> {
  merchants: Array<string>;
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<MerchantMetricsFinancialSubProfile>;
}

export const MerchantSeasonalTrendsChart: React.FC<
  MerchantSeasonalTrendsChartProps
> = ({
  merchants,
  xUNit,
  yUnit,
  currency,
  records,
  height,
  locale,
  enableAssistantMode,
  selectedSpendingPeriod,
}) => {
  const [selectedMerchant, setSelectedMerchant] = useState<string>(
    merchants[0] || "",
  );

  if (!records || records.length === 0) {
    return null;
  }

  const allChartData = useMemo(() => {
    return (
      MerchantFinancialMetricsConverter.identifySeasonalTrends(
        records,
        selectedSpendingPeriod,
      ) || []
    );
  }, [records, selectedSpendingPeriod]);

  const chartData = useMemo(() => {
    const data = allChartData[selectedMerchant] || [];

    // convert to scatter data points
    return Object.entries(data).map(
      ([season, value]) => ({ x: season, y: value }) as ScatterChartDataPoint,
    );
  }, [allChartData, selectedMerchant]);

  return (
    <div>
      <div className="flex flex-1 justify-between">
        <p className="flex flex-1 gap-2 p-[3%] text-lg font-bold md:text-2xl">
          <HiSquare3Stack3D className="inline-block h-6 w-6 align-middle" />
          {selectedMerchant}
        </p>
        <Select onValueChange={setSelectedMerchant} value={selectedMerchant}>
          <SelectTrigger className="my-[2%] w-fit">
            <SelectValue placeholder="Select a merchant" />
          </SelectTrigger>
          <SelectContent>
            {merchants.map((merchant) => (
              <SelectItem key={merchant} value={merchant}>
                {merchant}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScatterChart
        currency={currency}
        data={chartData}
        height={height}
        locale={locale}
        enableAssistantMode={enableAssistantMode}
        xUNit={xUNit}
        yUnit={yUnit}
      />
    </div>
  );
};
