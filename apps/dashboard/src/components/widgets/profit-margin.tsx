import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfYear, startOfYear } from "date-fns";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function ProfitMarginWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  const { data } = useQuery({
    ...trpc.widgets.getProfitMargin.queryOptions({
      from: startOfYear(new Date()).toISOString(),
      to: endOfYear(new Date()).toISOString(),
      currency: team?.baseCurrency ?? undefined,
      revenueType: "net",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewAnalysis = () => {
    // TODO: Navigate to profit margin analysis page
    console.log("View profit margin analysis clicked");
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <BaseWidget
      title="Profit Margin"
      icon={<Icons.PieChart className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            Net profit margin for {new Date().getFullYear()}
          </p>
        </div>
      }
      actions="View margin analysis"
      onClick={handleViewAnalysis}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          {formatPercentage(data?.result.profitMargin ?? 0)}
        </h2>
      </div>
    </BaseWidget>
  );
}
