"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { getDefaultTaxType } from "@midday/utils";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

function getTaxTerminology(
  countryCode: string | undefined,
  t: ReturnType<typeof useI18n>,
) {
  if (!countryCode) {
    return {
      collected: t("tax_summary.collected.default"),
      paid: t("tax_summary.paid.default"),
      title: t("tax_summary.title.default"),
    };
  }

  const taxType = getDefaultTaxType(countryCode);

  // Map tax type to i18n key
  const typeKey =
    taxType === "vat" || taxType === "gst" || taxType === "sales_tax"
      ? taxType
      : "default";

  return {
    collected: t(
      `tax_summary.collected.${typeKey}` as "tax_summary.collected.vat",
    ),
    paid: t(`tax_summary.paid.${typeKey}` as "tax_summary.paid.vat"),
    title: t(`tax_summary.title.${typeKey}` as "tax_summary.title.vat"),
  };
}

export function TaxSummaryWidget() {
  const trpc = useTRPC();
  const t = useI18n();
  const { data: user } = useUserQuery();
  const { data: team } = useTeamQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, currency } = useMetricsFilter();

  const taxTerms = getTaxTerminology(team?.countryCode ?? undefined, t);

  const { data: yearData, isLoading } = useQuery({
    ...trpc.widgets.getTaxSummary.queryOptions({
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title={taxTerms.title}
        icon={<Icons.ReceiptLong className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const taxData = yearData?.result;

  const collectedTax = taxData?.collected.totalTaxAmount ?? 0;
  const paidTax = taxData?.paid.totalTaxAmount ?? 0;
  const netAmount = collectedTax - paidTax;
  const isOwed = netAmount > 0;
  const hasActivity = collectedTax > 0 || paidTax > 0;

  const periodLabel = getPeriodLabel(period, from, to);

  const getDescription = () => {
    if (!hasActivity) {
      return `${t("tax_summary.no_activity")} · ${periodLabel}`;
    }

    if (Math.abs(netAmount) < 100) {
      return `${t("tax_summary.balanced")} · ${periodLabel}`;
    }

    const netStr = formatAmount({
      amount: Math.abs(netAmount),
      currency: currency || "USD",
      locale: user?.locale,
    });

    if (isOwed) {
      return `${t("tax_summary.remit_amount", { amount: netStr })} · ${periodLabel}`;
    }

    return `${t("tax_summary.credit_amount", { amount: netStr })} · ${periodLabel}`;
  };

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

  const handleViewTaxSummary = () => {
    // Use dynamic terminology based on tax type (VAT/GST/Sales Tax/Tax)
    const summaryText = taxTerms.title.toLowerCase();

    handleToolCall({
      toolName: "getTaxSummary",
      toolParams: {
        from,
        to,
        currency: currency,
        showCanvas: true,
      },
      text: `Show ${summaryText} for ${periodLabel}`,
    });
  };

  return (
    <BaseWidget
      title={taxTerms.title}
      icon={<Icons.ReceiptLong className="size-4" />}
      description={getDescription()}
      onClick={handleViewTaxSummary}
      actions="See detailed analysis"
    >
      {hasActivity && taxData && (
        <div className="flex flex-col gap-4">
          {/* Main net amount */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-normal">
              <FormatAmount
                amount={Math.abs(netAmount)}
                currency={currency || "USD"}
              />
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {taxTerms.collected}
              </span>
              <span className="font-medium">
                <FormatAmount
                  amount={collectedTax}
                  currency={currency || "USD"}
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{taxTerms.paid}</span>
              <span className="font-medium">
                <FormatAmount amount={paidTax} currency={currency || "USD"} />
              </span>
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
