"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function OverdueInvoicesAlertWidget() {
  const trpc = useTRPC();
  const _router = useRouter();
  const t = useI18n();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getOverdueInvoicesAlert.queryOptions(),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("overdue_invoices.title")}
        icon={<Icons.ReceiptLong className="size-4" />}
      />
    );
  }

  const overdueData = data?.result;
  const hasOverdue = overdueData && overdueData.count > 0;

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

  const handleViewOverdue = () => {
    if (!hasOverdue) return;

    handleToolCall({
      toolName: "getInvoices",
      toolParams: {
        statuses: ["overdue"],
        pageSize: 20,
      },
      text: "Show overdue invoices",
    });
  };

  const getDescription = () => {
    if (!hasOverdue) {
      return t("overdue_invoices.all_paid");
    }

    const { count, daysOverdue } = overdueData;
    const dayText = t("overdue_invoices.day", { count: daysOverdue });

    return t("overdue_invoices.description", {
      count,
      // @ts-expect-error
      days: daysOverdue,
      dayText,
    });
  };

  return (
    <BaseWidget
      title={t("overdue_invoices.title")}
      description={getDescription()}
      icon={<Icons.ReceiptLong className="size-4" />}
      onClick={hasOverdue ? handleViewOverdue : undefined}
      actions={hasOverdue ? t("overdue_invoices.view_overdue") : undefined}
    >
      {hasOverdue ? (
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-normal">
            <FormatAmount
              amount={overdueData.totalAmount}
              currency={overdueData.currency}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          </span>
        </div>
      ) : (
        <div className="py-8">
          <p className="text-sm text-muted-foreground">{getDescription()}</p>
        </div>
      )}
    </BaseWidget>
  );
}
