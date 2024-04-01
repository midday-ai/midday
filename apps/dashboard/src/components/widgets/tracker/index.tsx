import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { TrackerWidget } from "./tracker-widget";

export function Tracker({ date, hideDaysIndicators }) {
  return (
    <div className="border aspect-square overflow-hidden relative p-8">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <TrackerWidget date={date} hideDaysIndicators={hideDaysIndicators} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
