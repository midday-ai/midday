import { useEffect, useMemo, useState } from "react";
import { LocationFinancialMetricsConverter } from "../../../../lib/converters/location-sub-profile-converter";
import { ChartDataPoint } from "../../../../types/chart";
import { SpendingPeriod } from "../../../../types/merchant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { LocationFinancialSubProfile } from "client-typescript-sdk";
import { HiSquare3Stack3D } from "react-icons/hi2";

import { AreaChart, AreaChartProps } from "../../base/area-chart";

export interface MonthlyLocationGrowthRateChartProps
  extends Omit<AreaChartProps, "data"> {
  locations: Array<string>;
  selectedSpendingPeriod: SpendingPeriod;
  records: Array<LocationFinancialSubProfile>;
}

export const MonthlyLocationGrowthRateChart: React.FC<
  MonthlyLocationGrowthRateChartProps
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
    return LocationFinancialMetricsConverter.calculateMonthlyGrowthRate(
      records,
      selectedSpendingPeriod,
    );
  }, [records, selectedSpendingPeriod]);

  const chartData = useMemo(() => {
    const data = allChartData[selectedLocation] || [];

    // convert to scatter data points
    return data.map(
      ({ month, growthRate }) =>
        ({ date: month, value: growthRate }) as ChartDataPoint,
    );
  }, [allChartData, selectedLocation]);

  useEffect(() => {
    console.log("Component re-rendered. Selected location:", selectedLocation);
    console.log("Chart data:", chartData);
  }, [selectedLocation, chartData]);

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
