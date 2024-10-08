import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { FormatAmount } from "./format-amount";

export async function InvoicesPaid({
  defaultCurrency,
}: {
  defaultCurrency: string;
}) {
  const { data } = await getInvoiceSummary({ status: "paid" });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono font-medium text-2xl">
          <FormatAmount
            amount={data?.total_amount ?? 0}
            currency={data?.currency ?? defaultCurrency}
          />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div>Paid</div>
          <div className="text-sm text-muted-foreground">
            {data?.invoice_count} invoices
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
