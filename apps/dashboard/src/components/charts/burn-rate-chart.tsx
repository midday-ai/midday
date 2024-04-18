// import { FormatAmount } from "../format-amount";
import { getBurnRate } from "@midday/supabase/cached-queries";
import { FormatAmount } from "../format-amount";
import { AreaChart } from "./area-chart";

export async function BurnRateChart({ value, defaultValue, currency }) {
  const { data } = await getBurnRate({
    ...defaultValue,
    ...value,
    currency,
  });

  return (
    <div className="mt-5">
      <div className="space-y-2 mb-14">
        <h1 className="text-4xl font-mono">
          <FormatAmount
            amount={data[data?.length - 1]?.value}
            currency={currency}
          />
        </h1>

        <p className="text-sm text-[#606060]">This month</p>
      </div>
      <div className="h-[260px]">
        <AreaChart currency={currency} data={data} />
      </div>
    </div>
  );
}
