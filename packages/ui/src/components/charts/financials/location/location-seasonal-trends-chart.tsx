import React, { useMemo, useState } from "react";
import { LocationFinancialMetricsConverter } from "../../../../lib/converters/location-sub-profile-converter";
import { ScatterChartDataPoint } from "../../../../types/chart";
import { SpendingPeriod } from "@/types/merchant";
import { LocationFinancialSubProfile } from "client-typescript-sdk";
import { HiSquare3Stack3D } from "react-icons/hi2";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/select";

import { ScatterChart, ScatterChartProps } from "../../base/scatter-chart";

export interface LocationSeasonalTrendsChartProps
  extends Omit<ScatterChartProps, "data"> {
  locations: Array<string>;
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<LocationFinancialSubProfile>;
}

export const LocationSeasonalTrendsChart: React.FC<
  LocationSeasonalTrendsChartProps
> = ({
  locations,
  xUNit,
  yUnit,
  currency,
  records,
  height,
  locale,
  enableAssistantMode,
  selectedSpendingPeriod,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>(locations[0] || "");

  if (!records || records.length === 0) {
    return null;
  }

  const allChartData = useMemo(() => {
    return (
      LocationFinancialMetricsConverter.identifySeasonalTrends(
        records,
        selectedSpendingPeriod,
      ) || []
    );
  }, [records, selectedSpendingPeriod]);

  const chartData = useMemo(() => {
    const data = allChartData[selectedCity] || [];

    // convert to scatter data points
    return Object.entries(data).map(
      ([season, value]) => ({ x: season, y: value }) as ScatterChartDataPoint,
    );
  }, [allChartData, selectedCity]);

  return (
    <div>
      <div className="flex flex-1 justify-between">
        <p className="flex flex-1 gap-2 p-[3%] text-lg font-bold md:text-2xl">
          <HiSquare3Stack3D className="inline-block h-6 w-6 align-middle" />
          {selectedCity}
        </p>
        <Select onValueChange={setSelectedCity} value={selectedCity}>
          <SelectTrigger className="my-[2%] w-fit">
            <SelectValue placeholder="Select a Locationt" />
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
