import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { InvoiceWidgetHeader } from "./invoice-header";
import { InvoiceWidget } from "./invoice-widget";
import { InvoiceWidgetSkeleton } from "./skeleton";

export function Invoice() {
  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <InvoiceWidgetHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<InvoiceWidgetSkeleton />}>
          <InvoiceWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
