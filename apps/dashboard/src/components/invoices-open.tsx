import { getInvoiceSummary } from "@midday/supabase/cached-queries";
import Link from "next/link";
import { InvoiceSummary } from "./invoice-summary";

export async function InvoicesOpen({
  defaultCurrency,
}: {
  defaultCurrency: string;
}) {
  const { data } = await getInvoiceSummary();
  const totalInvoiceCount = data?.at(0)?.invoice_count;

  return (
    <Link
      href="/invoices?statuses=draft,overdue,unpaid"
      className="hidden sm:block"
    >
      <InvoiceSummary
        data={data}
        totalInvoiceCount={totalInvoiceCount}
        defaultCurrency={defaultCurrency}
        title="Open"
      />
    </Link>
  );
}
