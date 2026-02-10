"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { PaymentScoreVisualizer } from "../payment-score-visualizer";
import { BaseWidget } from "./base";
import { WidgetSkeleton } from "./widget-skeleton";

export function InvoicePaymentScoreWidget() {
  const trpc = useTRPC();
  const t = useI18n();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();
  const { data, isLoading } = useQuery(
    trpc.invoice.paymentStatus.queryOptions(),
  );

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Payment Score"
        icon={<Icons.Invoice className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const scorePercentage = data?.score ?? 0;

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
    const from = startOfMonth(subMonths(new Date(), 12));
    const to = endOfMonth(new Date());

    handleToolCall({
      toolName: "getInvoicePaymentAnalysis",
      toolParams: {
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
        currency: currency,
        showCanvas: true,
      },
      text: "Show invoice payment analysis",
    });
  };

  return (
    <BaseWidget
      title="Payment Score"
      description={
        <div>
          <h2 className="text-sm text-[#666] mb-4">
            {data?.paymentStatus
              ? // @ts-expect-error
                t(`payment_status_description.${data?.paymentStatus}`)
              : "No payment history yet"}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <PaymentScoreVisualizer score={scorePercentage} />
            </div>
          </div>
        </div>
      }
      icon={<Icons.Invoice className="size-4" />}
      actions="View invoices"
      onClick={handleViewInvoices}
    />
  );
}
