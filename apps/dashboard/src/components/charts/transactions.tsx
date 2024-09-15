import { Card } from "@midday/ui/card";
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

export async function Transactions({
  disabled,
  disableRelative = false,
}: {
  disabled: boolean;
  disableRelative?: boolean;
}) {
  const type = cookies().get("transactions-period")?.value ?? "all";

  return (
    <Card
      className={`aspect-square overflow-hidden p-4 md:p-8 rounded-2xl${disableRelative ? "" : " relative"}`}
    >
      <TransactionsPeriod
        type={type as "expense" | "income" | "all"}
        disabled={disabled}
      />

      <div className="mt-4">
        <TransactionsListHeader />
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense key={type} fallback={<TransactionsListSkeleton />}>
            <TransactionsList type={type} disabled={disabled} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </Card>
  );
}
