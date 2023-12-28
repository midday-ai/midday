import { Counter } from "@/components/counter";
import { getMetrics } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/utils";
import { cookies } from "next/headers";
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartData } from "./data";

export async function Chart({ value, defaultValue, disabled }) {
  const type = cookies().get("chart-type")?.value ?? "profit_loss";
  const data = disabled
    ? chartData
    : await getMetrics({ ...defaultValue, ...value, type });

  const lastPeriodAmount =
    data?.result[data.result?.length - 1]?.current?.value;

  return (
    <div className="relative mt-28">
      <div className="absolute -top-[110px] space-y-2">
        <h1 className={cn("text-3xl", disabled && "skeleton-box")}>
          <Counter
            value={data.summary.currentTotal}
            currency={data.summary.currency}
            lastPeriodAmount={lastPeriodAmount}
          />
        </h1>
        <p className={cn("text-sm text-[#606060]", disabled && "skeleton-box")}>
          vs{" "}
          <FormatAmount
            maximumFractionDigits={0}
            minimumFractionDigits={0}
            amount={data.summary.prevTotal || 0}
            currency={data.summary.currency}
          />{" "}
          last period
        </p>
      </div>
      <BarChart data={data} />
    </div>
  );
}
