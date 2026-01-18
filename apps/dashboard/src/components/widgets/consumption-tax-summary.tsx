/**
 * Consumption Tax Summary Widget (Midday-JP)
 *
 * Displays Japanese consumption tax (消費税) summary:
 * - Collected tax (預かり消費税) from sales
 * - Paid tax (支払消費税) from purchases
 * - Net tax payable (納付予定額)
 *
 * Supports Invoice System (インボイス制度) with qualified invoice tracking.
 */

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

export function ConsumptionTaxSummaryWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency, from, to } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getConsumptionTaxSummary.queryOptions({
      currency: currency || "JPY",
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("widgets.consumption_tax_summary.title")}
        icon={<Icons.Bank className="size-4" />}
        descriptionLines={3}
      />
    );
  }

  const taxData = data?.result;
  const collectedTax = taxData?.collectedTax ?? 0;
  const paidTax = taxData?.paidTax ?? 0;
  const netTaxPayable = taxData?.netTaxPayable ?? 0;
  const qualifiedInvoiceRatio = taxData?.qualifiedInvoiceRatio ?? 0;

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, string>;
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

  const handleViewConsumptionTax = () => {
    handleToolCall({
      toolName: "getConsumptionTaxSummary",
      text: "Show my consumption tax summary",
    });
  };

  const getNetTaxColor = () => {
    if (netTaxPayable > 0) return "text-red-500";
    if (netTaxPayable < 0) return "text-green-500";
    return "";
  };

  const getNetTaxLabel = () => {
    if (netTaxPayable > 0) return t("widgets.consumption_tax_summary.payable");
    if (netTaxPayable < 0) return t("widgets.consumption_tax_summary.refundable");
    return t("widgets.consumption_tax_summary.net");
  };

  return (
    <BaseWidget
      title={t("widgets.consumption_tax_summary.title")}
      icon={<Icons.Bank className="size-4" />}
      description={t("widgets.consumption_tax_summary.description")}
      onClick={handleViewConsumptionTax}
      actions={t("widgets.consumption_tax_summary.action")}
    >
      {taxData && (
        <div className="flex flex-col gap-3">
          <h2 className={`text-2xl font-normal ${getNetTaxColor()}`}>
            <FormatAmount
              currency={taxData.currency || "JPY"}
              amount={Math.abs(netTaxPayable)}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          </h2>

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">{t("widgets.consumption_tax_summary.collected")}</span>
              <span>
                <FormatAmount
                  currency={taxData.currency || "JPY"}
                  amount={collectedTax}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">{t("widgets.consumption_tax_summary.paid")}</span>
              <span>
                -
                <FormatAmount
                  currency={taxData.currency || "JPY"}
                  amount={paidTax}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed pt-1 mt-1">
              <span className="text-[#666666]">{getNetTaxLabel()}</span>
              <span className={getNetTaxColor()}>
                <FormatAmount
                  currency={taxData.currency || "JPY"}
                  amount={Math.abs(netTaxPayable)}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
            {qualifiedInvoiceRatio > 0 && (
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-[#666666]">{t("widgets.consumption_tax_summary.qualified_ratio")}</span>
                <span className="text-[#666666]">
                  {(qualifiedInvoiceRatio * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
