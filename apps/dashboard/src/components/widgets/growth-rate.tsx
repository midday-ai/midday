import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfQuarter, startOfQuarter } from "date-fns";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function GrowthRateWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  // Get current quarter dates
  const currentDate = new Date();
  const currentQuarterStart = startOfQuarter(currentDate);
  const currentQuarterEnd = endOfQuarter(currentDate);

  const { data } = useQuery({
    ...trpc.widgets.getGrowthRate.queryOptions({
      from: currentQuarterStart.toISOString(),
      to: currentQuarterEnd.toISOString(),
      currency: team?.baseCurrency ?? undefined,
      type: "revenue",
      revenueType: "net",
      period: "quarterly",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewAnalysis = () => {
    // TODO: Navigate to growth rate analysis page
    console.log("View growth rate analysis clicked");
  };

  const formatGrowthRate = (rate: number) => {
    const sign = rate > 0 ? "+" : "";
    return `${sign}${rate.toFixed(1)}%`;
  };

  return (
    <BaseWidget
      title="Growth Rate"
      icon={<Icons.ShowChart className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            Quarterly revenue growth rate
          </p>
        </div>
      }
      actions="View growth analysis"
      onClick={handleViewAnalysis}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-normal">
            {formatGrowthRate(data?.result.quarterlyGrowthRate ?? 0)}
          </h2>
        </div>
      </div>
    </BaseWidget>
  );
}
