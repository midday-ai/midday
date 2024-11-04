import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { getCustomers } from "@midday/supabase/cached-queries";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

export async function InvoiceHeader() {
  const customers = await getCustomers();

  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter customers={customers?.data ?? []} />

      <div className="hidden sm:block">
        <OpenInvoiceSheet />
      </div>
    </div>
  );
}
