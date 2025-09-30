"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { getDefaultTaxType } from "@midday/utils/tax";
import { useQuery } from "@tanstack/react-query";
import { endOfYear, format, startOfYear } from "date-fns";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

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
  const router = useRouter();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { data: user } = useUserQuery();

  const now = new Date();
  const taxTerms = getTaxTerminology(team?.countryCode ?? undefined, t);

  const { data: yearData } = useQuery({
    ...trpc.widgets.getTaxSummary.queryOptions({
      from: format(startOfYear(now), "yyyy-MM-dd"),
      to: format(endOfYear(now), "yyyy-MM-dd"),
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const taxData = yearData?.result;

  // Note: paid tax comes as negative from the query
  const collectedTax = taxData ? Math.abs(taxData.collected.totalTaxAmount) : 0;
  const paidTax = taxData ? Math.abs(taxData.paid.totalTaxAmount) : 0;
  const netAmount = collectedTax - paidTax;
  const isOwed = netAmount > 0;
  const hasActivity = collectedTax > 0 || paidTax > 0;

  const getDescription = () => {
    const year = now.getFullYear();
    const period = t("tax_summary.year_to_date", { year });

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

  const handleOpenAssistant = () => {
    router.push("/");
  };

  return (
    <BaseWidget
      title={taxTerms.title}
      icon={<Icons.ReceiptLong className="size-4" />}
      description={getDescription()}
      onClick={handleOpenAssistant}
      actions={t("tax_summary.open_assistant")}
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
  );
}
