import { formatAmount } from "@/utils/format";
import { getMetrics } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";
import { RevenueChart } from "./revenue-chart";

export async function Chart({ value, defaultValue }) {
  const type = cookies().get("chart-type")?.value ?? "profit_loss";
  const data = await getMetrics({ ...defaultValue, ...value, type });

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
      <RevenueChart data={data} />
    </div>
  );
}
