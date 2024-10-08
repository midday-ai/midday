import { InvoiceHeader } from "@/components/invoice-header";
import { InvoicesOpen } from "@/components/invoices-open";
import { InvoicesOverdue } from "@/components/invoices-overdue";
import { InvoicesPaid } from "@/components/invoices-paid";
import { InvoicesTable } from "@/components/tables/invoices";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Invoices | Midday",
};

export default function Invoices() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-6 pt-6">
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesOpen />
          <InvoicesPaid />
          <InvoicesOverdue />
        </Suspense>
      </div>

      <InvoiceHeader />

      <Suspense fallback={<div>Loading...</div>}>
        <InvoicesTable />
      </Suspense>
    </div>
  );
}
