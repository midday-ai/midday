import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { FormatAmount } from "./format-amount";

export async function InvoicesOverdue() {
  const { data } = await getInvoiceSummary({ status: "overdue" });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono font-medium text-2xl">
          <FormatAmount amount={data?.total_amount} currency={data?.currency} />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div>Overdue</div>
          <div className="text-sm text-muted-foreground">
            {data?.invoice_count} invoices
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
