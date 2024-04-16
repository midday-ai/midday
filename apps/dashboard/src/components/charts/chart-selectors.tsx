import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { ShareReport } from "@/components/share-report";
import { Cookies } from "@/utils/constants";
import { cookies } from "next/headers";
import { ChartCurrency } from "../chart-currency";

export async function ChartSelectors({ defaultValue, currency }) {
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  return (
    <div className="flex justify-between mt-6">
      <ChartType initialValue={chartType} />

      <div className="flex space-x-2">
        <ChartPeriod defaultValue={defaultValue} />
        <ChartCurrency defaultValue={currency} />
        <ShareReport
          defaultValue={defaultValue}
          type={chartType}
          currency={currency}
        />
      </div>
    </div>
  );
}
