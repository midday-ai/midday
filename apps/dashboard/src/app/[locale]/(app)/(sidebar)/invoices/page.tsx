import { EmptyStateInvoice } from "@/components/empty-state-invoice";
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
import { InvoicesTable } from "@/components/tables/invoices";
import { InvoiceSkeleton } from "@/components/tables/invoices/skeleton";
import { Cookies } from "@/utils/constants";
import { getDefaultSettings } from "@midday/invoice/default";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { searchParamsCache } from "./search-params";

export const metadata: Metadata = {
  title: "Invoices | Midday",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // TODO: Remove once invoice is general available
  const user = await getUser();

  if (!user?.data?.team?.flags?.includes("invoice")) {
    const hasRequested = cookies().get(Cookies.RequestAccess)?.value === "true";
    return <EmptyStateInvoice hasRequested={hasRequested} />;
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
        <Suspense fallback={<InvoiceSummarySkeleton />}>
          <InvoicesOpen defaultCurrency={defaultSettings.currency} />
        </Suspense>
        <Suspense fallback={<InvoiceSummarySkeleton />}>
          <InvoicesOverdue defaultCurrency={defaultSettings.currency} />
        </Suspense>
        <Suspense fallback={<InvoiceSummarySkeleton />}>
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
