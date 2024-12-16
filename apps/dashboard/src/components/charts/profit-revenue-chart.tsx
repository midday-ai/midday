import { getMetrics } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import Link from "next/link";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartExampleData } from "./data";

type Props = {
  value: any;
  defaultValue: any;
  type: string;
  disabled?: boolean;
  currency?: string;
};

export async function ProfitRevenueChart({
  value,
  defaultValue,
  type,
  disabled,
  currency,
}: Props) {
  const data = disabled
    ? chartExampleData
    : await getMetrics({ ...defaultValue, ...value, type, currency });

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
                {type === "profit" ? (
                  <div className="space-y-2">
                    <h3 className="font-medium text-primary">
                      Profit is calculated as your income minus expenses.
                    </h3>
                    <p>
                      Explanation: This shows how much you’re making after
                      costs. If the profit seems off, it may be due to internal
                      transfers labeled as income. You can adjust this by
                      excluding the transactions from the calculations.
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
                ) : (
                  <div className="space-y-2">
                    <h3 className="font-medium text-primary">
                      Revenue represents your total income from all sources.
                    </h3>
                    <p>
                      Explanation: This is your gross income before expenses. If
                      the revenue appears too high, internal transfers may have
                      been marked as income. You can fix this by excluding the
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
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <BarChart data={data} disabled={disabled} />
    </div>
  );
}
