import { ErrorFallback } from "@/components/error-fallback";
import { InvoiceHeader } from "@/components/invoice-header";
import { InvoicePaymentScore } from "@/components/invoice-payment-score";
import { InvoicesOpen } from "@/components/invoices-open";
import { InvoicesOverdue } from "@/components/invoices-overdue";
import { InvoicesPaid } from "@/components/invoices-paid";
import { InvoicesTable } from "@/components/tables/invoices";
import { InvoiceSkeleton } from "@/components/tables/invoices/skeleton";
import { getCountryCode } from "@midday/location";
import { currencies } from "@midday/location/src/currencies";
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
  } = searchParamsCache.parse(searchParams);

  const countryCode = getCountryCode();

  const defaultCurrency = currencies[countryCode];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-6 pt-6">
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesOpen defaultCurrency={defaultCurrency} />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesOverdue defaultCurrency={defaultCurrency} />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesPaid defaultCurrency={defaultCurrency} />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicePaymentScore />
        </Suspense>
      </div>

      <InvoiceHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<InvoiceSkeleton />}>
          <InvoicesTable
            query={query}
            sort={sort}
            start={start}
            end={end}
            statuses={statuses}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
