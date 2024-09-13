import React, { useMemo, useState } from "react";
import { LocationFinancialMetricsConverter } from "../../../../lib/converters/location-sub-profile-converter";
import { SpendingPeriod } from "../../../../types/merchant";
import { LocationFinancialSubProfile } from "client-typescript-sdk";
import { HiSquare3Stack3D } from "react-icons/hi2";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";

import { AreaChart, AreaChartProps } from "../../base/area-chart";

export interface LocationSpendingVsMonthChartProps
  extends Omit<AreaChartProps, "data"> {
  locations: Array<string>;
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<LocationFinancialSubProfile>;
}

export const LocationSpendingVsMonthChart: React.FC<
  LocationSpendingVsMonthChartProps
> = ({
  currency,
  records,
  height,
  locale,
  enableAssistantMode,
  locations,
  selectedSpendingPeriod,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(
    locations[0] || "",
  );

  const allChartData = useMemo(() => {
    return LocationFinancialMetricsConverter.generateSpendingTimeSeries(
      records,
      selectedSpendingPeriod,
    );
  }, [records, selectedSpendingPeriod]);

  const chartData = useMemo(() => {
    return allChartData[selectedLocation] || [];
  }, [allChartData, selectedLocation]);

  if (
    !records ||
    records.length === 0 ||
    !locations ||
    locations.length === 0
  ) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-1 justify-between">
        <p className="flex flex-1 gap-2 p-[3%] text-lg font-bold md:text-2xl">
          <HiSquare3Stack3D className="inline-block h-6 w-6 align-middle" />
          {selectedLocation}
        </p>
        <Select onValueChange={setSelectedLocation} value={selectedLocation}>
          <SelectTrigger className="my-[2%] w-fit">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
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
