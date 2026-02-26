import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function OutstandingDealsWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getOutstandingDeals.queryOptions({
      currency: currency,
      status: ["unpaid", "overdue"],
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Outstanding Deals"
        icon={<Icons.Deal className="size-4" />}
        descriptionLines={2}
        showValue={false}
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

  const handleViewDeals = () => {
    handleToolCall({
      toolName: "getDeals",
      toolParams: {
        statuses: ["unpaid", "overdue"],
        pageSize: 20,
      },
      text: "Show outstanding deals",
    });
  };

  return (
    <BaseWidget
      title="Outstanding Deals"
      icon={<Icons.Deal className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          {data?.result ? (
            <p className="text-sm text-[#666666]">
              You currently have{" "}
              <span className="text-primary">
                {data.result.count} unpaid and{" "}
                <FormatAmount
                  amount={data.result.totalAmount}
                  currency={currency || "USD"}
                />{" "}
                in outstanding deals
              </span>
            </p>
          ) : (
            <p className="text-sm text-[#666666]">
              You currently have{" "}
              <span className="text-primary">0 unpaid deals</span>
            </p>
          )}
        </div>
      }
      actions="View all deals"
      onClick={handleViewDeals}
    />
  );
}
