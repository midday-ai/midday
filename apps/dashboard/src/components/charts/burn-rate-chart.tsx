// import { FormatAmount } from "../format-amount";
import {
  getBurnRate,
  getCurrentBurnRate,
} from "@midday/supabase/cached-queries";
import { FormatAmount } from "../format-amount";
import { AreaChart } from "./area-chart";

export async function BurnRateChart({ value, defaultValue, currency }) {
  const [{ data: burnRateData }, { data: currentBurnRateData, error }] =
    await Promise.all([
      getBurnRate({
        ...defaultValue,
        ...value,
        currency,
      }),
      getCurrentBurnRate({ currency }),
    ]);

  console.log(error);

  return (
    <div className="mt-5">
      <div className="space-y-2 mb-14">
        <h1 className="text-4xl font-mono">
          <FormatAmount amount={currentBurnRateData} currency={currency} />
        </h1>

        <p className="text-sm text-[#606060]">This month</p>
      </div>
      <div className="h-[260px]">
        <AreaChart currency={currency} data={burnRateData} />
      </div>
    </div>
  );
}
