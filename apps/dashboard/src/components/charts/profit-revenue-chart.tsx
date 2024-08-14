import { getMetrics } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartExampleData } from "./data";

type Props = {
  value: any;
  defaultValue: any;
  currency: string;
  type: string;
  disabled?: boolean;
};

export async function ProfitRevenueChart({
  value,
  defaultValue,
  currency,
  type,
  disabled,
}: Props) {
  const data = disabled
    ? chartExampleData
    : await getMetrics({ ...defaultValue, ...value, type, currency });

  return (
    <div className={cn(disabled && "pointer-events-none select-none")}>
      <div className="space-y-2 mb-14 inline-block">
        <h1 className="text-4xl font-mono">
          <FormatAmount
            amount={data?.summary?.currentTotal ?? 0}
            currency={data?.summary?.currency ?? "USD"}
          />
        </h1>
        <p className="text-sm text-[#606060]">
          vs{" "}
          <FormatAmount
            maximumFractionDigits={0}
            minimumFractionDigits={0}
            amount={data?.summary?.prevTotal ?? 0}
            currency={data?.summary?.currency ?? "USD"}
          />{" "}
          last period
        </p>
      </div>
      <BarChart data={data} currency={currency} disabled={disabled} />
    </div>
  );
}
