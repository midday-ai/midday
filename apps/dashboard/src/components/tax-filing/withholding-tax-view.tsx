"use client";

import { useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import type { WithholdingTaxSummaryData } from "@midday/db/queries";
import { Badge } from "@midday/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";

interface WithholdingTaxViewProps {
  data?: WithholdingTaxSummaryData;
  isLoading?: boolean;
  currency?: string;
  locale?: string;
}

export function WithholdingTaxView({
  data,
  isLoading,
  currency = "JPY",
  locale = "ja-JP",
}: WithholdingTaxViewProps) {
  const t = useI18n();

  const formatValue = (value: number | undefined) => {
    if (value === undefined) return "-";
    return formatAmount({
      amount: value,
      currency,
      locale,
      maximumFractionDigits: 0,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRefund = (data?.estimatedRefund ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_filing.sections.withholding_tax")}</CardTitle>
        <CardDescription>
          {t("tax_filing.withholding_tax.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              {t("tax_filing.withholding_tax.total_withheld")}
            </p>
            <p className="text-2xl font-bold">{formatValue(data?.totalWithheld)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("tax_filing.withholding_tax.transaction_count", {
                count: data?.transactionCount ?? 0,
              })}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              {t("tax_filing.withholding_tax.subject_to_withholding")}
            </p>
            <p className="text-2xl font-bold">{formatValue(data?.subjectToWithholding)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("tax_filing.withholding_tax.estimated_note")}
            </p>
          </div>
          <div className={`rounded-lg border p-4 ${hasRefund ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}>
            <p className="text-sm text-muted-foreground">
              {t("tax_filing.withholding_tax.estimated_refund")}
            </p>
            <p className={`text-2xl font-bold ${hasRefund ? "text-green-600" : ""}`}>
              {formatValue(data?.estimatedRefund)}
            </p>
            {hasRefund && (
              <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                {t("tax_filing.withholding_tax.refund_expected")}
              </Badge>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            {t("tax_filing.withholding_tax.note")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
