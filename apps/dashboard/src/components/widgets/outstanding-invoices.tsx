import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function OutstandingInvoicesWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getOutstandingInvoices.queryOptions({
      currency: currency,
      status: ["unpaid", "overdue"],
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("widgets.outstanding_invoices.title")}
        icon={<Icons.Invoice className="size-4" />}
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

  const handleViewInvoices = () => {
    handleToolCall({
      toolName: "getInvoices",
      toolParams: {
        statuses: ["unpaid", "overdue"],
        pageSize: 20,
      },
      text: "Show outstanding invoices",
    });
  };

  return (
    <BaseWidget
      title={t("widgets.outstanding_invoices.title")}
      icon={<Icons.Invoice className="size-4" />}
      description={
        data?.result ? (
          <p className="text-sm text-[#666666]">
            <span className="text-primary">
              {data.result.count} {t("widgets.outstanding_invoices.count")} ·{" "}
              <FormatAmount
                amount={data.result.totalAmount}
                currency={currency || "USD"}
              />
            </span>
          </p>
        ) : (
          <p className="text-sm text-[#666666]">
            {t("widgets.outstanding_invoices.no_invoices")}
          </p>
        )
      }
      actions={t("widgets.outstanding_invoices.action")}
      onClick={handleViewInvoices}
    />
  );
}
