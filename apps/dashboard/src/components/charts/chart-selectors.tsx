import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { ShareReport } from "@/components/share-report";
import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";

export async function ChartSelectors({ defaultValue }) {
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  return (
    <div className="flex justify-between mt-6">
      <ChartType initialValue={chartType} />

      <div className="flex space-x-2">
        <ChartPeriod defaultValue={defaultValue} />
        <ShareReport defaultValue={defaultValue} type={chartType} />
      </div>
    </div>
  );
}
