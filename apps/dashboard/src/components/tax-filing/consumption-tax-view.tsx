"use client";

import { useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import type { ConsumptionTaxSummaryData } from "@midday/db/queries";
import { Badge } from "@midday/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";

interface ConsumptionTaxViewProps {
  data?: ConsumptionTaxSummaryData;
  isLoading?: boolean;
  currency?: string;
  locale?: string;
}

export function ConsumptionTaxView({
  data,
  isLoading,
  currency = "JPY",
  locale = "ja-JP",
}: ConsumptionTaxViewProps) {
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
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const taxPayable = data?.taxPayable ?? 0;
  const isRefund = taxPayable < 0;

  // Calculate derived values
  const outputTax10 = (data?.taxableSales10 ?? 0) * 0.1;
  const outputTax8 = (data?.taxableSales8 ?? 0) * 0.08;
  const totalOutputTax = data?.collectedTax ?? 0;
  const totalSales = (data?.taxableSales10 ?? 0) + (data?.taxableSales8 ?? 0) + (data?.exemptSales ?? 0);
  const totalPurchases = (data?.taxablePurchasesQualified ?? 0) + (data?.taxablePurchasesNonQualified ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_filing.sections.consumption_tax")}</CardTitle>
        <CardDescription>
          {t("tax_filing.consumption_tax.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sales Summary */}
        <div>
          <h4 className="mb-3 font-semibold text-sm">
            {t("tax_filing.consumption_tax.sales_section")}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tax_filing.consumption_tax.category")}</TableHead>
                <TableHead className="text-right">{t("tax_filing.consumption_tax.taxable_amount")}</TableHead>
                <TableHead className="text-right">{t("tax_filing.consumption_tax.tax_amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t("tax_filing.consumption_tax.taxable_sales_10")}</TableCell>
                <TableCell className="text-right">{formatValue(data?.taxableSales10)}</TableCell>
                <TableCell className="text-right">{formatValue(outputTax10)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("tax_filing.consumption_tax.taxable_sales_8")}</TableCell>
                <TableCell className="text-right">{formatValue(data?.taxableSales8)}</TableCell>
                <TableCell className="text-right">{formatValue(outputTax8)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("tax_filing.consumption_tax.exempt_sales")}</TableCell>
                <TableCell className="text-right">{formatValue(data?.exemptSales)}</TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>{t("tax_filing.consumption_tax.total_output_tax")}</TableCell>
                <TableCell className="text-right">{formatValue(totalSales)}</TableCell>
                <TableCell className="text-right">{formatValue(totalOutputTax)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Purchases Summary */}
        <div>
          <h4 className="mb-3 font-semibold text-sm">
            {t("tax_filing.consumption_tax.purchases_section")}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tax_filing.consumption_tax.category")}</TableHead>
                <TableHead className="text-right">{t("tax_filing.consumption_tax.taxable_amount")}</TableHead>
                <TableHead className="text-right">{t("tax_filing.consumption_tax.tax_amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t("tax_filing.consumption_tax.qualified_purchases")}</TableCell>
                <TableCell className="text-right">{formatValue(data?.taxablePurchasesQualified)}</TableCell>
                <TableCell className="text-right">{formatValue(data?.paidTaxDeductible)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("tax_filing.consumption_tax.non_qualified_purchases")}</TableCell>
                <TableCell className="text-right">{formatValue(data?.taxablePurchasesNonQualified)}</TableCell>
                <TableCell className="text-right">{formatValue(data?.paidTaxNonDeductible)}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>{t("tax_filing.consumption_tax.total_input_tax")}</TableCell>
                <TableCell className="text-right">{formatValue(totalPurchases)}</TableCell>
                <TableCell className="text-right">{formatValue((data?.paidTaxDeductible ?? 0) + (data?.paidTaxNonDeductible ?? 0))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Invoice System (インボイス制度) */}
        <div>
          <h4 className="mb-3 font-semibold text-sm">
            {t("tax_filing.consumption_tax.invoice_system")}
          </h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                {t("tax_filing.consumption_tax.qualified_input_tax")}
              </p>
              <p className="text-xl font-bold">{formatValue(data?.paidTaxDeductible)}</p>
              <Badge variant="outline" className="mt-2">
                {t("tax_filing.consumption_tax.has_qualified_invoice")}
              </Badge>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                {t("tax_filing.consumption_tax.non_qualified_input_tax")}
              </p>
              <p className="text-xl font-bold">{formatValue(data?.paidTaxNonDeductible)}</p>
              <Badge variant="secondary" className="mt-2">
                {t("tax_filing.consumption_tax.no_qualified_invoice")}
              </Badge>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                {t("tax_filing.consumption_tax.qualified_ratio")}
              </p>
              <p className="text-xl font-bold">
                {data?.qualifiedInvoiceRatio !== undefined
                  ? `${(data.qualifiedInvoiceRatio * 100).toFixed(1)}%`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Tax Payable Summary */}
        <div className="rounded-lg border-2 border-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isRefund
                  ? t("tax_filing.consumption_tax.refundable")
                  : t("tax_filing.consumption_tax.tax_payable")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("tax_filing.consumption_tax.calculation")}:
                {` ${formatValue(totalOutputTax)} - ${formatValue(data?.paidTaxDeductible)}`}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isRefund ? "text-green-600" : ""}`}>
                {isRefund ? `(${formatValue(Math.abs(taxPayable))})` : formatValue(taxPayable)}
              </p>
              {isRefund && (
                <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                  {t("tax_filing.consumption_tax.refund")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
