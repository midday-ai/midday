import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { TrackerHeader } from "./tracker-header";
import { TrackerWidget } from "./tracker-widget";

export async function Tracker() {
  return (
    <div className="flex-1 border p-8 relative h-full">
      <TrackerHeader />

      <div className="mt-10">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense>
            <TrackerWidget />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
