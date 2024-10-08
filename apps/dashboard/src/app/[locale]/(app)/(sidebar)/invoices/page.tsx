import { InvoiceHeader } from "@/components/invoice-header";
import { InvoicesOpen } from "@/components/invoices-open";
import { InvoicesOverdue } from "@/components/invoices-overdue";
import { InvoicesPaid } from "@/components/invoices-paid";
import { InvoicesTable } from "@/components/tables/invoices";
import { InvoiceSkeleton } from "@/components/tables/invoices/skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import { searchParamsCache } from "./search-params";

export const metadata: Metadata = {
  title: "Invoices | Midday",
};

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { q: query, sort } = searchParamsCache.parse(searchParams);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-6 pt-6">
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesOpen />
          <InvoicesOverdue />
          <InvoicesPaid />
        </Suspense>
      </div>

      <InvoiceHeader />

      <Suspense fallback={<InvoiceSkeleton />}>
        <InvoicesTable query={query} sort={sort} />
      </Suspense>
    </div>
  );
}
