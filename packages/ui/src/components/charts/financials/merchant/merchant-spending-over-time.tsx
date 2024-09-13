import React, { useMemo, useState } from "react";
import { MerchantFinancialMetricsConverter } from "../../../../lib/converters/merchant-sub-profile-converter";
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

import { AreaChart, AreaChartProps } from "../../base/area-chart";

export interface SpendingVsMonthChartProps
  extends Omit<AreaChartProps, "data"> {
  merchants: Array<string>;
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<MerchantMetricsFinancialSubProfile>;
}

export const MerchantSpendingVsMonthChart: React.FC<
  SpendingVsMonthChartProps
> = ({
  currency,
  records,
  height,
  locale,
  enableAssistantMode,
  merchants,
  selectedSpendingPeriod,
}) => {
  const [selectedMerchant, setSelectedMerchant] = useState<string>(
    merchants[0] || "",
  );

  const allChartData = useMemo(() => {
    return MerchantFinancialMetricsConverter.generateSpendingTimeSeries(
      records,
      selectedSpendingPeriod,
    );
  }, [records, selectedSpendingPeriod]);

  const chartData = useMemo(() => {
    return allChartData[selectedMerchant] || [];
  }, [allChartData, selectedMerchant]);

  if (
    !records ||
    records.length === 0 ||
    !merchants ||
    merchants.length === 0
  ) {
    return null;
  }

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

      <div className="py-[2%]">
        <AreaChart
          currency={currency}
          data={chartData}
          height={height}
          locale={locale}
          enableAssistantMode={enableAssistantMode}
        />
      </div>
    </div>
  );
};
