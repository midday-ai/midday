import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

export function InvoiceHeader() {
  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter />

      <div>
        <OpenInvoiceSheet />
      </div>
    </div>
  );
}
