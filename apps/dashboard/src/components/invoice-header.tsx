import { InvoiceSearchFilter } from "@/components/invoice-search-filter";
import { InvoiceColumnVisibility } from "./invoice-column-visibility";
import { OpenInvoiceSheet } from "./open-invoice-sheet";

export function InvoiceHeader() {
  return (
    <div className="flex items-center justify-between">
      <InvoiceSearchFilter />

      <div className="hidden sm:flex space-x-2">
        <InvoiceColumnVisibility />
        <OpenInvoiceSheet />
      </div>
    </div>
  );
}
