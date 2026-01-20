"use client";

import { useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import type { BalanceSheetData } from "@midday/db/queries";
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

interface BalanceSheetViewProps {
  data?: BalanceSheetData;
  isLoading?: boolean;
  currency?: string;
  locale?: string;
}

export function BalanceSheetView({
  data,
  isLoading,
  currency = "JPY",
  locale = "ja-JP",
}: BalanceSheetViewProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_filing.sections.balance_sheet")}</CardTitle>
        <CardDescription>
          {t("tax_filing.balance_sheet.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Assets */}
          <div>
            <h4 className="mb-3 font-semibold text-sm">
              {t("tax_filing.balance_sheet.assets")}
            </h4>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="pl-6">{t("tax_filing.balance_sheet.cash")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.assets.cash)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">{t("tax_filing.balance_sheet.accounts_receivable")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.assets.accountsReceivable)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">{t("tax_filing.balance_sheet.other_assets")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.assets.other)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 font-bold">
                  <TableCell>{t("tax_filing.balance_sheet.total_assets")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.assets.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Liabilities & Equity */}
          <div>
            <h4 className="mb-3 font-semibold text-sm">
              {t("tax_filing.balance_sheet.liabilities_equity")}
            </h4>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="pl-6">{t("tax_filing.balance_sheet.accounts_payable")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.liabilities.accountsPayable)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">{t("tax_filing.balance_sheet.other_liabilities")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.liabilities.other)}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">{t("tax_filing.balance_sheet.total_liabilities")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.liabilities.total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t("tax_filing.balance_sheet.equity")}</TableCell>
                  <TableCell className="text-right">{formatValue(data?.equity)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 font-bold">
                  <TableCell>{t("tax_filing.balance_sheet.total_liabilities_equity")}</TableCell>
                  <TableCell className="text-right">
                    {formatValue((data?.liabilities.total ?? 0) + (data?.equity ?? 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        {data?.asOfDate && (
          <p className="text-sm text-muted-foreground mt-4">
            {t("tax_filing.balance_sheet.as_of_date")}: {data.asOfDate}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
