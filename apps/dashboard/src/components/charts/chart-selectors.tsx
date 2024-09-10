import { ChartMore } from "@/components/charts/chart-more";
import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { ChartFiltersServer } from "./chart-filters.server";

export async function ChartSelectors({ defaultValue }) {
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  return (
    <div className="flex justify-between mt-6 space-x-2">
      <div className="flex space-x-2">
        <ChartType initialValue={chartType} />
      </div>

      <div className="flex space-x-2">
        <ChartPeriod defaultValue={defaultValue} />
        <ChartFiltersServer />
        <ChartMore defaultValue={defaultValue} type={chartType} />
      </div>
    </div>
  );
}
