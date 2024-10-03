import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import {
  TrackerWidgetServer,
  TrackerWidgetSkeleton,
} from "./tracker-widget.server";

type Props = {
  date: string;
};

export function Tracker({ date }: Props) {
  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense fallback={<TrackerWidgetSkeleton key={date} />}>
          <TrackerWidgetServer date={date} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
