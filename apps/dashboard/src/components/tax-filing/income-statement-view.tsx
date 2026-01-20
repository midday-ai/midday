"use client";

import { useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import type { IncomeStatementData } from "@midday/db/queries";
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

interface IncomeStatementViewProps {
  data?: IncomeStatementData;
  isLoading?: boolean;
  currency?: string;
  locale?: string;
}

export function IncomeStatementView({
  data,
  isLoading,
  currency = "JPY",
  locale = "ja-JP",
}: IncomeStatementViewProps) {
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
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const rows = [
    { label: t("tax_filing.income_statement.revenue"), value: data?.revenue.total, isTotal: false },
    { label: t("tax_filing.income_statement.operating_expenses"), value: data?.expenses.total, isTotal: false, isNegative: true },
    { label: t("tax_filing.income_statement.gross_profit"), value: data?.grossProfit, isTotal: true },
    { label: t("tax_filing.income_statement.operating_income"), value: data?.operatingIncome, isTotal: true, isFinal: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_filing.sections.income_statement")}</CardTitle>
        <CardDescription>
          {t("tax_filing.income_statement.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">{t("tax_filing.income_statement.item")}</TableHead>
              <TableHead className="text-right">{t("tax_filing.income_statement.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={index}
                className={row.isFinal ? "border-t-2 border-primary font-bold" : row.isTotal ? "bg-muted/50 font-medium" : ""}
              >
                <TableCell className={row.isNegative ? "pl-8" : ""}>
                  {row.label}
                </TableCell>
                <TableCell className="text-right">
                  {row.isNegative && row.value ? `(${formatValue(Math.abs(row.value))})` : formatValue(row.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
