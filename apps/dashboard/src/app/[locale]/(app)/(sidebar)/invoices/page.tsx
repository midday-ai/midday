import { ErrorFallback } from "@/components/error-fallback";
import { InvoiceHeader } from "@/components/invoice-header";
import {
  InvoicePaymentScore,
  InvoicePaymentScoreSkeleton,
} from "@/components/invoice-payment-score";
import { InvoiceSummarySkeleton } from "@/components/invoice-summary";
import { InvoicesOpen } from "@/components/invoices-open";
import { InvoicesOverdue } from "@/components/invoices-overdue";
import { InvoicesPaid } from "@/components/invoices-paid";
import { DataTable } from "@/components/tables/invoices/data-table";
import { InvoiceSkeleton } from "@/components/tables/invoices/skeleton";
import { loadInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Invoices | Midday",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadInvoiceFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);

  batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.invoice.get.infiniteQueryOptions({
      filter,
      sort,
    }),
    trpc.invoice.invoiceSummary.queryOptions(),
    trpc.invoice.invoiceSummary.queryOptions({
      status: "paid",
    }),
    trpc.invoice.invoiceSummary.queryOptions({
      status: "overdue",
    }),
    trpc.invoice.paymentStatus.queryOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
        <Suspense fallback={<InvoiceSummarySkeleton />}>
          <InvoicesOpen />
        </Suspense>
        <Suspense fallback={<InvoiceSummarySkeleton />}>
          <InvoicesOverdue />
        </Suspense>
        <Suspense fallback={<InvoiceSummarySkeleton />}>
          <InvoicesPaid />
        </Suspense>
        <Suspense fallback={<InvoicePaymentScoreSkeleton />}>
          <InvoicePaymentScore />
        </Suspense>
      </div>

      <InvoiceHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<InvoiceSkeleton />}>
          <DataTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
