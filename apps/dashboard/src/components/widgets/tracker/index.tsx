import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { TrackerWidget } from "./tracker-widget";

export function Tracker({ date }) {
  return (
    <div className="border aspect-square p-8 relative">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <TrackerWidget date={date} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
