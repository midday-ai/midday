import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import {
  VaultWidget,
  VaultWidgetHeader,
  VaultWidgetSkeleton,
} from "./vault-widget";

export function Vault() {
  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <VaultWidgetHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<VaultWidgetSkeleton />}>
          <VaultWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
