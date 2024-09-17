import { getExpenses } from "@midday/supabase/cached-queries";
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
import { expenseChartExampleData } from "./data";
import { StackedBarChart } from "./stacked-bar-chart";

type Props = {
  value: any;
  defaultValue: any;
  disabled?: boolean;
  currency?: string;
};

export async function ExpenseChart({
  value,
  defaultValue,
  disabled,
  currency,
}: Props) {
  const data = disabled
    ? expenseChartExampleData
    : await getExpenses({ ...defaultValue, ...value, currency });

  return (
    <div className={cn(disabled && "pointer-events-none select-none")}>
      <div className="space-y-2 mb-14 inline-block select-text">
        <h1 className="text-4xl font-mono">
          <AnimatedNumber
            value={data?.summary?.averageExpense ?? 0}
            currency={data?.summary?.currency ?? "USD"}
          />
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">Average expenses</p>
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
                    Expenses Overview
                  </h3>
                  <p>
                    Expenses include all outgoing transactions, including
                    recurring ones. The chart shows total expenses and recurring
                    costs, helping you identify spending patterns and fixed
                    costs.
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
      <StackedBarChart data={data} disabled={disabled} />
    </div>
  );
}
