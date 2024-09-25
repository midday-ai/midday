import { ChartMore } from "@/components/charts/chart-more";
import { ChartPeriod } from "@/components/charts/chart-period";
import { ChartType } from "@/components/charts/chart-type";
import { Cookies } from "@/utils/constants";
import { cn } from "@midday/ui/cn";
import { cookies } from "next/headers";
import { ChartFiltersServer } from "./chart-filters.server";

export type DateRange = {
  to: string;
  from: string;
  type: "profit" | "revenue";
};

export interface ChartSelectorsProps {
  defaultValue: DateRange;
  disableTypeSelector?: boolean;
}

export async function ChartSelectors({
  defaultValue,
  disableTypeSelector,
}: ChartSelectorsProps) {
  const chartType = cookies().get(Cookies.ChartType)?.value ?? "profit";

  return (
    <div
      className={cn(
        "flex justify-between mt-6 space-x-2",
        disableTypeSelector && "justify-end",
      )}
    >
      {!disableTypeSelector && (
        <div className="flex space-x-2">
          <ChartType initialValue={chartType} />
        </div>
      )}
      <div className={cn("flex space-x-2")}>
        <ChartPeriod defaultValue={defaultValue} />
        <ChartFiltersServer />
        <ChartMore
          defaultValue={defaultValue}
          type={chartType as "profit" | "revenue"}
        />
      </div>
    </div>
  );
}
