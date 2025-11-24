"use client";

import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { getDefaultTaxType, getWidgetPeriodDates } from "@midday/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { BaseWidget } from "./base";
import { ConfigurableWidget } from "./configurable-widget";
import { useConfigurableWidget } from "./use-configurable-widget";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSettings } from "./widget-settings";

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
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { data: user } = useUserQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("tax-summary");

  const taxTerms = getTaxTerminology(team?.countryCode ?? undefined, t);

  // Get date range based on widget config or default to trailing_12
  const { from: fromDate, to: toDate } = useMemo(() => {
    const period = config?.period ?? "trailing_12";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const { data: yearData } = useQuery({
    ...trpc.widgets.getTaxSummary.queryOptions({
      from: format(fromDate, "yyyy-MM-dd"),
      to: format(toDate, "yyyy-MM-dd"),
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const taxData = yearData?.result;

  const collectedTax = taxData?.collected.totalTaxAmount ?? 0;
  const paidTax = taxData?.paid.totalTaxAmount ?? 0;
  const netAmount = collectedTax - paidTax;
  const isOwed = netAmount > 0;
  const hasActivity = collectedTax > 0 || paidTax > 0;

  const getDescription = () => {
    const periodKey = config?.period ?? "trailing_12";
    const period = t(
      `widget_period.${periodKey}` as "widget_period.fiscal_ytd",
    );

    if (!hasActivity) {
      return `${t("tax_summary.no_activity")} · ${period}`;
    }

    if (Math.abs(netAmount) < 100) {
      return `${t("tax_summary.balanced")} · ${period}`;
    }

    const netStr = formatAmount({
      amount: Math.abs(netAmount),
      currency: taxData?.currency || "USD",
      locale: user?.locale,
    });

    if (isOwed) {
      return `${t("tax_summary.remit_amount", { amount: netStr })} · ${period}`;
    }

    return `${t("tax_summary.credit_amount", { amount: netStr })} · ${period}`;
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
    const periodLabel = t(
      `widget_period.${config?.period ?? "trailing_12"}` as "widget_period.fiscal_ytd",
    );

    handleToolCall({
      toolName: "getTaxSummary",
      toolParams: {
        from: format(fromDate, "yyyy-MM-dd"),
        to: format(toDate, "yyyy-MM-dd"),
        currency: team?.baseCurrency ?? undefined,
        showCanvas: true,
      },
      text: `Show ${summaryText} for ${periodLabel}`,
    });
  };

  return (
    <ConfigurableWidget
      isConfiguring={isConfiguring}
      settings={
        <WidgetSettings
          config={config}
          onSave={saveConfig}
          onCancel={() => setIsConfiguring(false)}
          showPeriod
          showRevenueType={false}
        />
      }
    >
      <BaseWidget
        title={taxTerms.title}
        icon={<Icons.ReceiptLong className="size-4" />}
        description={getDescription()}
        onClick={handleViewTaxSummary}
        actions="See detailed analysis"
        onConfigure={() => setIsConfiguring(true)}
      >
        {hasActivity && taxData && (
          <div className="flex flex-col gap-4">
            {/* Main net amount */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium">
                <FormatAmount
                  amount={Math.abs(netAmount)}
                  currency={taxData.currency}
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
                    currency={taxData.currency}
                  />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{taxTerms.paid}</span>
                <span className="font-medium">
                  <FormatAmount amount={paidTax} currency={taxData.currency} />
                </span>
              </div>
            </div>
          </div>
        )}
      </BaseWidget>
    </ConfigurableWidget>
  );
}
