import { formatAmount } from "@/utils/format";
import { getMetrics } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/utils";
import { cookies } from "next/headers";
import { BarChart } from "./bar-chart";
import { chartData } from "./data";

export async function Chart({ value, defaultValue, disabled }) {
  const type = cookies().get("chart-type")?.value ?? "profit_loss";
  const data = disabled
    ? chartData
    : await getMetrics({ ...defaultValue, ...value, type });

  return (
    <div className="relative mt-28">
      <div className="absolute -top-[110px] space-y-2">
        <h1 className={cn("text-3xl", true && "skeleton-box")}>
          {formatAmount({
            amount: data.summary.currentTotal || 0,
            currency: data.summary.currency,
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          })}
        </h1>
        <p className={cn("text-sm text-[#606060]", true && "skeleton-box")}>
          vs{" "}
          {formatAmount({
            amount: data.summary.prevTotal || 0,
            currency: data.summary.currency,
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          })}{" "}
          last period
        </p>
      </div>
      <BarChart data={data} />
    </div>
  );
}
