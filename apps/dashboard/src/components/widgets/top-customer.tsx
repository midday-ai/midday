import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function TopCustomerWidget() {
  const t = useI18n();
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
        title={t("widgets.top_customer.title")}
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
      title={t("widgets.top_customer.title")}
      icon={<Icons.Star className="size-4" />}
      description={
        <p className="text-sm text-[#666666]">
          {data?.result?.customerName && data?.result?.currency ? (
            <span className="text-primary">
              {data.result.customerName} ·{" "}
              <FormatAmount
                amount={data.result.totalRevenue}
                currency={data.result.currency}
              />
            </span>
          ) : (
            <>{t("widgets.top_customer.no_customers")}</>
          )}
        </p>
      }
      actions={t("widgets.top_customer.action")}
      onClick={handleViewTopCustomer}
    />
  );
}
