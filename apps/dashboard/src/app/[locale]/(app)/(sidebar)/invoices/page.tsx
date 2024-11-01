import { ErrorFallback } from "@/components/error-fallback";
import { InvoiceHeader } from "@/components/invoice-header";
import {
  InvoicePaymentScore,
  InvoicePaymentScoreSkeleton,
} from "@/components/invoice-payment-score";
import { InvoicesOpen, InvoicesOpenSkeleton } from "@/components/invoices-open";
import {
  InvoicesOverdue,
  InvoicesOverdueSkeleton,
} from "@/components/invoices-overdue";
import { InvoicesPaid, InvoicesPaidSkeleton } from "@/components/invoices-paid";
import { InvoicesTable } from "@/components/tables/invoices";
import { InvoiceSkeleton } from "@/components/tables/invoices/skeleton";
import { getDefaultSettings } from "@midday/invoice/default";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
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
  const {
    q: query,
    sort,
    start,
    end,
    statuses,
    customers,
    page,
  } = searchParamsCache.parse(searchParams);

  const defaultSettings = getDefaultSettings();

  const loadingKey = JSON.stringify({
    q: query,
    sort,
    start,
    end,
    statuses,
    customers,
    page,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-6 pt-6">
        <Suspense fallback={<InvoicesOpenSkeleton />}>
          <InvoicesOpen defaultCurrency={defaultSettings.currency} />
        </Suspense>
        <Suspense fallback={<InvoicesOverdueSkeleton />}>
          <InvoicesOverdue defaultCurrency={defaultSettings.currency} />
        </Suspense>
        <Suspense fallback={<InvoicesPaidSkeleton />}>
          <InvoicesPaid defaultCurrency={defaultSettings.currency} />
        </Suspense>
        <Suspense fallback={<InvoicePaymentScoreSkeleton />}>
          <InvoicePaymentScore />
        </Suspense>
      </div>

      <InvoiceHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<InvoiceSkeleton />} key={loadingKey}>
          <InvoicesTable
            query={query}
            sort={sort}
            start={start}
            end={end}
            statuses={statuses}
            customers={customers}
            page={page}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
