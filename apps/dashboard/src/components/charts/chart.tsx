import { getMetrics } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartData } from "./data";

export async function Chart({ value, defaultValue, disabled, currency, type }) {
  const data = disabled
    ? chartData
    : await getMetrics({ ...defaultValue, ...value, type, currency });

  return (
    <div className="relative mt-36">
      <div className="absolute -top-[120px] space-y-2">
        <h1 className={cn("text-4xl font-mono", disabled && "skeleton-box")}>
          <FormatAmount
            amount={data.summary.currentTotal}
            currency={data.summary.currency}
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
      <BarChart data={data} disabled={disabled} />
    </div>
  );
}
