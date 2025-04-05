import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";

export function ChartSelectors() {
  return (
    <div className="flex justify-between mt-6 space-x-2">
      <div className="flex space-x-2">
        <ChartType />
      </div>

      <div className="flex space-x-2">
        <ChartPeriod />
        {/* <ChartFilters
        currencies={
          currencies?.data?.map((currency) => {
            return {
              id: currency.currency,
              name: currency.currency,
            };
          }) ?? []
        }
      /> */}
      </div>
    </div>
  );
}
