import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { VaultHeader } from "./vault-header";
import { VaultWidget } from "./vault-widget";

export function Vault() {
  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <VaultHeader />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <VaultWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
