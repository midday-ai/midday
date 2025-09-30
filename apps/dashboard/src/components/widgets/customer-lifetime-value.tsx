"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function CustomerLifetimeValueWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getCustomerLifetimeValue.queryOptions({
      currency: team?.baseCurrency ?? undefined,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewDetails = () => {
    router.push("/customers");
  };

  const result = data?.result;
  const summary = result?.summary;
  const currency = summary?.currency || team?.baseCurrency || "USD";

  // Calculate active customer percentage
  const activePercentage =
    summary?.totalCustomers && summary.totalCustomers > 0
      ? Math.round((summary.activeCustomers / summary.totalCustomers) * 100)
      : 0;

  return (
    <BaseWidget
      title="Customer Lifetime Value"
      icon={<Icons.Customers className="size-4" />}
      description={
        <div className="flex flex-col gap-3">
          {!isLoading && summary ? (
            <>
              {/* Average CLV */}
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-medium">
                  <FormatAmount
                    amount={summary.averageCLV}
                    currency={currency}
                  />
                </p>
                <span className="text-xs text-[#878787]">avg. CLV</span>
              </div>

              {/* Summary Stats */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#878787] text-xs">
                    Total customers
                  </span>
                  <span className="font-medium">{summary.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#878787] text-xs">Active (30d)</span>
                  <span className="font-medium">
                    {summary.activeCustomers}{" "}
                    <span className="text-[#878787]">
                      ({activePercentage}%)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#878787] text-xs">Avg. lifespan</span>
                  <span className="font-medium">
                    {summary.averageLifespanDays} days
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleViewDetails}
                className="text-xs text-[#878787] hover:text-foreground text-left transition-colors mt-1"
              >
                View all customers
              </button>
            </>
          ) : (
            <div className="flex items-center min-h-[120px]">
              <div className="text-xs text-muted-foreground">
                No customer data available
              </div>
            </div>
          )}
        </div>
      }
      actions=""
      onClick={handleViewDetails}
    >
      <div />
    </BaseWidget>
  );
}
