import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { InsightsWidget } from "./insights-widget";

export function Insights() {
  return (
    <div className="flex-1 border p-8 relative h-full">
      <h2 className="text-lg">Insights</h2>
      <div className="h-[350px]">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense
            fallback={
              <h1 className="text-[#878787] font-mono text-2xl mt-8">
                Loading...
              </h1>
            }
          >
            <InsightsWidget />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
