import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { InboxHeader } from "./inbox-header";
import { InboxWidget } from "./inbox-widget";

export async function Inbox({ disabled }) {
  const filter = cookies().get("inbox-filter")?.value ?? "all";

  return (
    <div className="flex-1 border p-8 relative">
      <InboxHeader filter={filter} disabled={disabled} />

      <div className="h-[350px]">
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense>
            <InboxWidget disabled={disabled} filter={filter} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
