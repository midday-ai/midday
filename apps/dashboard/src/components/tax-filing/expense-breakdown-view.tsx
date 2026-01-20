"use client";

import { useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import type { ExpenseByCategoryData } from "@midday/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";

interface ExpenseBreakdownViewProps {
  data?: ExpenseByCategoryData[];
  isLoading?: boolean;
  currency?: string;
  locale?: string;
}

export function ExpenseBreakdownView({
  data = [],
  isLoading,
  currency = "JPY",
  locale = "ja-JP",
}: ExpenseBreakdownViewProps) {
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

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("tax_filing.sections.expense_breakdown")}</CardTitle>
          <CardDescription>
            {t("tax_filing.expense_breakdown.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("tax_filing.empty.no_data")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_filing.sections.expense_breakdown")}</CardTitle>
        <CardDescription>
          {t("tax_filing.expense_breakdown.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("tax_filing.expense_breakdown.code")}</TableHead>
              <TableHead>{t("tax_filing.expense_breakdown.category")}</TableHead>
              <TableHead className="text-right">{t("tax_filing.expense_breakdown.amount")}</TableHead>
              <TableHead className="text-right w-[80px]">{t("tax_filing.expense_breakdown.count")}</TableHead>
              <TableHead className="w-[200px]">{t("tax_filing.expense_breakdown.ratio")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((category) => {
              const percentage = totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;
              return (
                <TableRow key={category.categoryCode}>
                  <TableCell className="font-mono text-sm">{category.categoryCode}</TableCell>
                  <TableCell>{locale === "ja-JP" ? category.categoryNameJa : category.categoryNameEn}</TableCell>
                  <TableCell className="text-right">{formatValue(category.amount)}</TableCell>
                  <TableCell className="text-right">{category.transactionCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-[40px]">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="border-t-2 font-bold">
              <TableCell colSpan={2}>{t("tax_filing.expense_breakdown.total")}</TableCell>
              <TableCell className="text-right">{formatValue(totalAmount)}</TableCell>
              <TableCell className="text-right">
                {data.reduce((sum, item) => sum + item.transactionCount, 0)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={100} className="h-2" />
                  <span className="text-xs text-muted-foreground w-[40px]">100%</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
