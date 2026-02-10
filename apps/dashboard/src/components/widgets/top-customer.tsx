import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function TopCustomerWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getTopCustomer.queryOptions(),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Top Customer"
        icon={<Icons.Star className="size-4" />}
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

  const handleViewTopCustomer = () => {
    handleToolCall({
      toolName: "getCustomers",
      toolParams: {
        sort: ["totalRevenue", "desc"],
        pageSize: 10,
      },
      text: "Show top customers",
    });
  };

  return (
    <BaseWidget
      title="Top Customer"
      icon={<Icons.Star className="size-4" />}
      description={
        <p className="text-sm text-[#666666]">
          {data?.result?.customerName && data?.result?.currency ? (
            <>
              Your top customer is{" "}
              <span className="text-primary">
                {data.result.customerName} with{" "}
                <FormatAmount
                  amount={data.result.totalRevenue}
                  currency={data.result.currency}
                />{" "}
                from {data.result.invoiceCount} invoice
                {data.result.invoiceCount !== 1 ? "s" : ""} past 30 days
              </span>
            </>
          ) : (
            <>No top customer in the past 30 days</>
          )}
        </p>
      }
      actions="View top customer"
      onClick={handleViewTopCustomer}
    />
  );
}
