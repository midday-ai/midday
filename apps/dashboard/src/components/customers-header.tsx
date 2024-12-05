import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { getCustomers } from "@midday/supabase/cached-queries";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

export async function CustomersHeader() {
  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter />

      <div className="hidden sm:block">
        <OpenInvoiceSheet />
      </div>
    </div>
  );
}
