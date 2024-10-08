import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { FormatAmount } from "./format-amount";

export async function InvoicesPaid() {
  const { data } = await getInvoiceSummary({ status: "paid" });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono font-medium text-2xl">
          <FormatAmount amount={data?.total_amount} currency={data?.currency} />
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
