import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { TrackerWidget } from "./tracker-widget";

export function Tracker({ date }) {
  return (
    <div className="flex-1 border p-8 relative h-full">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <TrackerWidget date={date} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
