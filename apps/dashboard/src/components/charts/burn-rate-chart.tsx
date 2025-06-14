"use client";

import { useMetricsParams } from "@/hooks/use-metrics-params";
import { useTRPC } from "@/trpc/client";
import { calculateAvgBurnRate } from "@/utils/format";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AnimatedNumber } from "../animated-number";
import { AreaChart } from "./area-chart";
import { burnRateExamleData } from "./data";

type Props = {
  disabled?: boolean;
};

export function BurnRateChart({ disabled }: Props) {
  const trpc = useTRPC();
  const { params } = useMetricsParams();

  const { data } = useQuery({
    ...trpc.metrics.burnRate.queryOptions({
      from: params.from,
      to: params.to,
    }),
    placeholderData: (previousData) => previousData ?? burnRateExamleData,
  });

  const { data: runway } = useQuery({
    ...trpc.metrics.runway.queryOptions({
      from: params.from,
      to: params.to,
    }),
  });

  return (
    <div
      className={cn(
        disabled && "pointer-events-none select-none blur-[8px] opacity-20",
      )}
    >
      <div className="space-y-2 mb-14 select-text">
        <h1 className="text-4xl font-mono">
          <AnimatedNumber
            value={calculateAvgBurnRate(data ?? [])}
            currency={data?.at(0)?.currency ?? "USD"}
          />
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <span>
            {runway && runway > 0
              ? `${runway} ${runway === 1 ? "month" : "months"} runway`
              : "Average burn rate"}
          </span>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Icons.Info className="h-4 w-4 mt-1" />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs text-[#878787] max-w-[240px] p-4 space-y-2"
                side="bottom"
                sideOffset={10}
              >
                <h3 className="font-medium text-primary">
                  The Burn Rate is your monthly expenses divided by your current
                  balance, estimating how long your funds will last.
                </h3>
                <p>
                  Explanation: This tracks how fast you’re spending. If it’s
                  incorrect, internal transfers may be counted as income. You
                  can adjust this by excluding the transactions from the
                  calculations.
                </p>

                <p>
                  All amounts are converted into your{" "}
                  <Link
                    href="/settings/accounts"
                    className="text-primary underline"
                  >
                    base currency
                  </Link>
                  .
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <AreaChart data={data} />
    </div>
  );
}
