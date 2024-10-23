import { getI18n } from "@/locales/server";
import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import Link from "next/link";
import { FormatAmount } from "./format-amount";

export function InvoicesPaidSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <Skeleton className="h-8 w-32" />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export async function InvoicesPaid({
  defaultCurrency,
}: {
  defaultCurrency: string;
}) {
  const { data } = await getInvoiceSummary({ status: "paid" });
  const t = await getI18n();

  return (
    <Link href="/invoices?statuses=paid">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono font-medium text-2xl">
            <FormatAmount
              amount={data?.total_amount ?? 0}
              currency={data?.currency ?? defaultCurrency}
              maximumFractionDigits={0}
              minimumFractionDigits={0}
            />
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <div>Paid</div>
            <div className="text-sm text-muted-foreground">
              {t("invoice_count", {
                count: data?.invoice_count ?? 0,
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
