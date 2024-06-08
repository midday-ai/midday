import { calculateAvgBurnRate } from "@/utils/format";
import { getBurnRate, getRunway } from "@midday/supabase/cached-queries";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { FormatAmount } from "../format-amount";
import { AreaChart } from "./area-chart";

type Props = {
  value: unknown;
  defaultValue: unknown;
  currency: string;
};

export async function BurnRateChart({ value, defaultValue, currency }: Props) {
  const [{ data: burnRateData }, { data: runway }] = await Promise.all([
    getBurnRate({
      ...defaultValue,
      ...value,
      currency,
    }),
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
          <FormatAmount
            amount={calculateAvgBurnRate(burnRateData)}
            currency={currency}
          />
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <span>
            {runway && runway > 0
              ? `${runway} months runway`
              : "Average burn rate"}
          </span>
          {runway && runway > 0 && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icons.Info className="h-4 w-4 mt-1" />
                </TooltipTrigger>
                <TooltipContent className="px-3 py-1.5 text-xs">
                  Average burn rate / Total balance
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="h-[260px]">
        <AreaChart currency={currency} data={burnRateData} />
      </div>
    </div>
  );
}
