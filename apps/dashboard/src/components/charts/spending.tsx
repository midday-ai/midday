import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "../error-fallback";
import { SpendingList } from "./spending-list";
import { SpendingPeriod } from "./spending-period";

export async function Spending({ disabled, initialPeriod }) {
  return (
    <div className="flex-1 border p-8 relative h-full">
      <SpendingPeriod initialPeriod={initialPeriod} />

      <div className="h-[350px]">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense>
            <SpendingList initialPeriod={initialPeriod} disabled={disabled} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
