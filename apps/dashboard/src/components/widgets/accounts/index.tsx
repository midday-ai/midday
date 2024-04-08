// import { AccountsSkeleton } from "@/components/accounts-list";
import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { AccountsWidget } from "./accounts-widget";

export async function Accounts({ disabled }) {
  return (
    <div className="border relative aspect-square overflow-hidden p-8">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense
        //   fallback={<AccountsSkeleton numberOfItems={3} className="pt-8" />}
        >
          <AccountsWidget disabled={disabled} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
