import { ErrorFallback } from "@/components/error-fallback";
import { InboxSkeleton } from "@/components/inbox-list";
import { Cookies } from "@/utils/constants";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { InboxHeader } from "./inbox-header";
import { InboxWidget } from "./inbox-widget";

export async function Inbox({ disabled }) {
  const filter = cookies().get(Cookies.InboxFilter)?.value ?? "all";

  return (
    <div className="border p-8 relative aspect-square">
      <InboxHeader filter={filter} disabled={disabled} />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense
          key={filter}
          fallback={<InboxSkeleton numberOfItems={3} className="pt-8" />}
        >
          <InboxWidget disabled={disabled} filter={filter} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
