import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { AccountBalanceWidget } from "./account-balance-widget";

export function AccountBalance() {
  return (
    <div className="border relative aspect-square overflow-hidden p-4 md:p-8">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <AccountBalanceWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
