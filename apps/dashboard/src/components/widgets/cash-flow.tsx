import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, startOfMonth } from "date-fns";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function CashFlowWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();

  const { data } = useQuery({
    ...trpc.widgets.getCashFlow.queryOptions({
      from: startOfMonth(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
      currency: team?.baseCurrency ?? undefined,
      period: "monthly",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewAnalysis = () => {
    // TODO: Navigate to cash flow analysis page
    console.log("View cash flow analysis clicked");
  };

  const formatCashFlow = (amount: number, currency: string) => {
    const sign = amount >= 0 ? "+" : "";
    const formatted = formatAmount({
      amount,
      currency,
      locale: user?.locale,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${sign}${formatted}`;
  };

  return (
    <BaseWidget
      title="Cash Flow"
      icon={<Icons.Accounts className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">Net cash position</p>
        </div>
      }
      actions="View cash flow analysis"
      onClick={handleViewAnalysis}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          {data &&
            formatCashFlow(data.result.netCashFlow ?? 0, data.result.currency!)}
        </h2>
      </div>
    </BaseWidget>
  );
}
