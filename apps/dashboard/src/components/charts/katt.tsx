import { Chart } from "@/components/charts/chart";
import { formatAmount } from "@/utils/format";
import { getMetrics } from "@midday/supabase/cached-queries";
import { startOfMonth, startOfYear, subMonths } from "date-fns";

export async function Katt() {
  const data = await getMetrics({
    from: startOfYear(startOfMonth(new Date())).toDateString(),
    to: new Date().toDateString(),
  });

  return (
    <div className="relative mt-28">
      <div className="absolute -top-[110px]">
        <h1 className="text-3xl mb-1">
          {formatAmount({
            amount: data.summary.currentTotal || 0,
            currency: data.summary.currency,
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          })}
        </h1>
        <p className="text-sm text-[#606060]">
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
      <Chart data={data} />
    </div>
  );
}
