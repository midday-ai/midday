import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfYear, startOfYear } from "date-fns";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function RevenueSummaryWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  const { data } = useQuery({
    ...trpc.widgets.getRevenueSummary.queryOptions({
      from: startOfYear(new Date()).toISOString(),
      to: endOfYear(new Date()).toISOString(),
      currency: team?.baseCurrency ?? undefined,
      revenueType: "net",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewTrends = () => {
    // TODO: Navigate to revenue trends page or open revenue analysis
    console.log("View revenue trends clicked");
  };

  return (
    <BaseWidget
      title="Revenue this year"
      icon={<Icons.TrendingUp className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            {data?.result.revenueType === "net" ? "Net" : "Gross"} revenue for{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      }
      actions="View revenue trends"
      onClick={handleViewTrends}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          <FormatAmount
            amount={data?.result.totalRevenue ?? 0}
            currency={data?.result.currency!}
          />
        </h2>
      </div>
    </BaseWidget>
  );
}
