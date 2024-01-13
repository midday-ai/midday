import { ErrorFallback } from "@/components/error-fallback";
import { InboxSkeleton } from "@/components/inbox-list";
import { Cookies } from "@/utils/constants";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { TrackerHeader } from "./tracker-header";
import { TrackerWidget } from "./tracker-widget";

export async function Tracker({ disabled }) {
  const filter = cookies().get(Cookies.InboxFilter)?.value ?? "all";

  return (
    <div className="flex-1 border p-8 relative h-full">
      <TrackerHeader filter={filter} disabled={disabled} />

      <div className="mt-10">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense
            key={filter}
            fallback={<InboxSkeleton numberOfItems={4} className="pt-8" />}
          >
            <TrackerWidget />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
