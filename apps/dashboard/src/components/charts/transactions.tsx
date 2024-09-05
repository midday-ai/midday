import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ErrorFallback } from "../error-fallback";
import {
  TransactionsList,
  TransactionsListHeader,
  TransactionsListSkeleton,
} from "./transactions-list";
import { TransactionsPeriod } from "./transactions-period";

export async function Transactions({ disabled }) {
  const type = cookies().get("transactions-period")?.value ?? "all";

  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <TransactionsPeriod type={type} disabled={disabled} />

      <div className="mt-4">
        <TransactionsListHeader />
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense key={type} fallback={<TransactionsListSkeleton />}>
            <TransactionsList type={type} disabled={disabled} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
