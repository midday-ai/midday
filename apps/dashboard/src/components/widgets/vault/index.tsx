import { ErrorFallback } from "@/components/error-fallback";
import { Card } from "@midday/ui/card";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import {
  VaultWidget,
  VaultWidgetHeader,
  VaultWidgetSkeleton,
} from "./vault-widget";

export function Vault() {
  return (
    <Card className="aspect-square overflow-hidden relative p-4 md:p-8 rounded-2xl">
      <VaultWidgetHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<VaultWidgetSkeleton />}>
          <VaultWidget />
        </Suspense>
      </ErrorBoundary>
    </Card>
  );
}
