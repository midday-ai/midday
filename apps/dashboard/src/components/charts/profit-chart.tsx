import { useMetricsParams } from "@/hooks/use-metrics-params";
import { useTRPC } from "@/trpc/client";
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
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartExampleData } from "./data";

type Props = {
  disabled?: boolean;
};

export function ProfitChart({ disabled }: Props) {
  const trpc = useTRPC();
  const { params } = useMetricsParams();

  const { data } = useQuery({
    ...trpc.metrics.profit.queryOptions({
      from: params.from,
      to: params.to,
    }),
    placeholderData: (previousData) => previousData ?? chartExampleData,
  });

  return (
    <div className={cn(disabled && "pointer-events-none select-none")}>
      <div className="space-y-2 mb-14 inline-block select-text">
        <h1 className="text-4xl font-mono">
          <AnimatedNumber
            value={data?.summary?.currentTotal ?? 0}
            currency={data?.summary?.currency ?? "USD"}
          />
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">
            vs{" "}
            <FormatAmount
              maximumFractionDigits={0}
              minimumFractionDigits={0}
              amount={data?.summary?.prevTotal ?? 0}
              currency={data?.meta?.currency ?? "USD"}
            />{" "}
            last period
          </p>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Icons.Info className="h-4 w-4 mt-1" />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs text-[#878787] max-w-[240px] p-4"
                side="bottom"
                sideOffset={10}
              >
                <div className="space-y-2">
                  <h3 className="font-medium text-primary">
                    Profit is calculated as your income minus expenses.
                  </h3>
                  <p>
                    Explanation: This shows how much you're making after costs.
                    If the profit seems off, it may be due to internal transfers
                    labeled as income. You can adjust this by excluding the
                    transactions from the calculations.
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
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <BarChart data={data} />
    </div>
  );
}
