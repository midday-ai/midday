import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "../error-fallback";
import { SpendingList, SpendingListSkeleton } from "./spending-list";
import { SpendingPeriod } from "./spending-period";

export async function Spending({
  disabled,
  initialPeriod,
  currency,
}: {
  disabled: boolean;
  initialPeriod: any;
  currency?: string;
}) {
  return (
    <div className="border aspect-square relative overflow-hidden">
      <div className="p-4 md:p-8 flex-col">
        <SpendingPeriod initialPeriod={initialPeriod} />

        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<SpendingListSkeleton />} key={initialPeriod}>
            <SpendingList
              initialPeriod={initialPeriod}
              disabled={disabled}
              currency={currency}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
