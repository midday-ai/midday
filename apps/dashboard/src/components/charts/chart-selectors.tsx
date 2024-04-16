import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { ShareReport } from "@/components/share-report";
import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { ChartCurrency } from "../chart-currency";

export async function ChartSelectors({ defaultValue }) {
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";
  const chartCurrency = cookies().get(Cookies.ChartCurrency)?.value;

  return (
    <div className="flex justify-between mt-6">
      <ChartType initialValue={chartType} />

      <div className="flex space-x-2">
        <ChartPeriod defaultValue={defaultValue} />
        <ChartCurrency defaultValue={chartCurrency} />
        <ShareReport defaultValue={defaultValue} type={chartType} />
      </div>
    </div>
  );
}
