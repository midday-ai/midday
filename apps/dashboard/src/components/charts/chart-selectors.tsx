import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";

export async function ChartSelectors({ defaultValue }) {
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit_loss";

  return (
    <div className="flex justify-between mt-6">
      <ChartType initialValue={chartType} />
      <ChartPeriod defaultValue={defaultValue} />
    </div>
  );
}
