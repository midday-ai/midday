import { ErrorFallback } from "@/components/error-fallback";
import { Card } from "@midday/ui/card";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import {
  AccountBalanceSkeleton,
  AccountBalanceWidget,
} from "./account-balance-widget";

export async function AccountBalance() {
  return (
    <Card className="relative aspect-square overflow-hidden p-4 md:p-8 rounded-2xl">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<AccountBalanceSkeleton />}>
          <AccountBalanceWidget />
        </Suspense>
      </ErrorBoundary>
    </Card>
  );
}
