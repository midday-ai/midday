import { getInventoryCostAnalysis } from "@midday/supabase/cached-queries";
import { BarChart } from "@midday/ui/charts/base/bar-chart";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import Link from "next/link";
import { EmptyState } from "./empty-state";

type Props = {
  value: any;
  defaultValue: any;
  disabled?: boolean;
  currency?: string;
};

export async function InventoryCostChart({
  value,
  defaultValue,
  disabled,
  currency,
}: Props) {
  // TODO: handle disabled
  const result = await getInventoryCostAnalysis({
    ...defaultValue,
    ...value,
    currency,
  });

  if (!result) {
    return null;
  }

  const chartData = result.data?.map((item) => ({
    date: item.month,
    value: item.total_expense,
  }));

  if (chartData?.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-foreground">
          No inventory cost data available for the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(disabled && "pointer-events-none select-none")}>
      <div className="space-y-2 mb-14 inline-block select-text">
        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">Inventory Cost</p>
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
                  <h3 className="font-medium text-primary">Inventory Cost</h3>
                  <p>
                    Inventory Cost is the cost of the inventory that you have in
                    your warehouse. It is calculated by the cost of the
                    inventory that you have in your warehouse.
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
      <BarChart
        data={chartData ?? []}
        disabled={disabled}
        currency={currency}
      />
    </div>
  );
}
