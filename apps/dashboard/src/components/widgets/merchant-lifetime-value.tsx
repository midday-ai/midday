"use client";

import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function MerchantLifetimeValueWidget() {
  const trpc = useTRPC();
  const router = useRouter();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getMerchantLifetimeValue.queryOptions({
      currency: currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Merchant Lifetime Value"
        icon={<Icons.Customers className="size-4" />}
        descriptionLines={3}
      />
    );
  }

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, any>;
    text: string;
  }) => {
    if (!chatId) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: params.text }],
      metadata: {
        toolCall: {
          toolName: params.toolName,
          toolParams: params.toolParams,
        },
      },
    });
  };

  const handleViewDetails = () => {
    handleToolCall({
      toolName: "getMerchants",
      toolParams: {
        sort: ["totalRevenue", "desc"],
        pageSize: 10,
      },
      text: "Show merchants",
    });
  };

  const result = data?.result;
  const summary = result?.summary;
  const displayCurrency = currency || "USD";

  // Calculate active merchant percentage
  const activePercentage =
    summary?.totalMerchants && summary.totalMerchants > 0
      ? Math.round((summary.activeMerchants / summary.totalMerchants) * 100)
      : 0;

  return (
    <BaseWidget
      title="Merchant Lifetime Value"
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
                    currency={displayCurrency}
                  />
                </p>
                <span className="text-xs text-[#878787]">avg. CLV</span>
              </div>

              {/* Summary Stats */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#878787] text-xs">
                    Total merchants
                  </span>
                  <span className="font-medium">{summary.totalMerchants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#878787] text-xs">Active (30d)</span>
                  <span className="font-medium">
                    {summary.activeMerchants}{" "}
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
                View all merchants
              </button>
            </>
          ) : (
            <div className="flex items-center min-h-[120px]">
              <div className="text-xs text-muted-foreground">
                No merchant data available
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
