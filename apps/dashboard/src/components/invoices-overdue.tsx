import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import Link from "next/link";
import { InvoiceSummary } from "./invoice-summary";

type Props = {
  defaultCurrency: string;
};

export async function InvoicesOverdue({ defaultCurrency }: Props) {
  const { data } = await getInvoiceSummary({ status: "overdue" });

  const totalInvoiceCount = data?.at(0)?.invoice_count;

  return (
    <Link href="/invoices?statuses=overdue" className="hidden sm:block">
      <InvoiceSummary
        data={data}
        totalInvoiceCount={totalInvoiceCount}
        defaultCurrency={defaultCurrency}
        title="Overdue"
      />
    </Link>
  );
}
