"use client";

import { FormatAmount } from "@/components/format-amount";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function OverdueInvoicesAlertWidget() {
  const trpc = useTRPC();
  const router = useRouter();
  const t = useI18n();

  const { data } = useQuery({
    ...trpc.widgets.getOverdueInvoicesAlert.queryOptions(),
    ...WIDGET_POLLING_CONFIG,
  });

  const overdueData = data?.result;
  const hasOverdue = overdueData && overdueData.count > 0;

  const handleViewOverdue = () => {
    if (!hasOverdue) return;
    router.push("/invoices?statuses=overdue");
  };

  const getDescription = () => {
    if (!hasOverdue) {
      return t("overdue_invoices.all_paid");
    }

    const { count, daysOverdue } = overdueData;
    const dayText = t("overdue_invoices.day", { count: daysOverdue });

    return t("overdue_invoices.description", {
      count,
      // @ts-ignore
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
          <span className="text-3xl font-medium">
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
