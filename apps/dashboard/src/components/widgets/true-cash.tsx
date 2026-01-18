/**
 * True Cash Widget (Midday-JP)
 *
 * Displays "True Cash" - the actual spendable money after accounting
 * for estimated tax obligations (consumption tax, income tax).
 *
 * Formula: True Cash = Cash Balance - Consumption Tax Reserve - Income Tax Reserve
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

export function TrueCashWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getTrueCash.queryOptions({
      currency: currency || "JPY",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={t("widgets.true_cash.title")}
        icon={<Icons.Accounts className="size-4" />}
        descriptionLines={3}
      />
    );
  }

  const trueCashData = data?.result;
  const trueCash = trueCashData?.trueCash ?? 0;
  const cashBalance = trueCashData?.cashBalance ?? 0;
  const consumptionTaxReserve = trueCashData?.consumptionTaxReserve ?? 0;
  const incomeTaxReserve = trueCashData?.incomeTaxReserve ?? 0;

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

  const handleViewTrueCash = () => {
    handleToolCall({
      toolName: "getTrueCash",
      text: "Show my true cash position",
    });
  };

  return (
    <BaseWidget
      title={t("widgets.true_cash.title")}
      icon={<Icons.Accounts className="size-4" />}
      description={t("widgets.true_cash.description")}
      onClick={handleViewTrueCash}
      actions={t("widgets.true_cash.action")}
    >
      {trueCashData && (
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-normal">
            <FormatAmount
              currency={trueCashData.currency || "JPY"}
              amount={trueCash}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          </h2>

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">{t("widgets.true_cash.cash_balance")}</span>
              <span>
                <FormatAmount
                  currency={trueCashData.currency || "JPY"}
                  amount={cashBalance}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">{t("widgets.true_cash.consumption_tax_reserve")}</span>
              <span className="text-orange-500">
                -
                <FormatAmount
                  currency={trueCashData.currency || "JPY"}
                  amount={consumptionTaxReserve}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">{t("widgets.true_cash.income_tax_reserve")}</span>
              <span className="text-orange-500">
                -
                <FormatAmount
                  currency={trueCashData.currency || "JPY"}
                  amount={incomeTaxReserve}
                  minimumFractionDigits={0}
                  maximumFractionDigits={0}
                />
              </span>
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
