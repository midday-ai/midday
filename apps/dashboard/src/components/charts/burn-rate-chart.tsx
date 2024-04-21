import {
  getBurnRate,
  getCurrentBurnRate,
  getRunway,
} from "@midday/supabase/cached-queries";
import { FormatAmount } from "../format-amount";
import { AreaChart } from "./area-chart";

type Props = {
  value: unknown;
  defaultValue: unknown;
  currency: string;
};

export async function BurnRateChart({ value, defaultValue, currency }: Props) {
  const [
    { data: burnRateData },
    { data: currentBurnRateData },
    { data: runway },
  ] = await Promise.all([
    getBurnRate({
      ...defaultValue,
      ...value,
      currency,
    }),
    getCurrentBurnRate({ currency }),
    getRunway({
      ...defaultValue,
      ...value,
      currency,
    }),
  ]);

  return (
    <div className="mt-5">
      <div className="space-y-2 mb-14">
        <h1 className="text-4xl font-mono">
          <FormatAmount amount={currentBurnRateData ?? 0} currency={currency} />
        </h1>

        <p className="text-sm text-[#606060]">
          {runway && runway > 0 ? `${runway} months runway` : "This month"}
        </p>
      </div>
      <div className="h-[260px]">
        <AreaChart currency={currency} data={burnRateData} />
      </div>
    </div>
  );
}
