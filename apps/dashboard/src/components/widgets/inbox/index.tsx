import { ErrorFallback } from "@/components/error-fallback";
import { InboxListSkeleton } from "@/components/inbox-list-skeleton";
import { Cookies } from "@/utils/constants";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { InboxHeader } from "./inbox-header";
import { InboxWidget } from "./inbox-widget";

export async function Inbox({ disabled }) {
  const filter = cookies().get(Cookies.InboxFilter)?.value ?? "all";

  return (
    <div className="border relative aspect-square overflow-hidden p-4 md:p-8">
      <InboxHeader filter={filter} disabled={disabled} />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense
          key={filter}
          fallback={<InboxListSkeleton numberOfItems={3} className="pt-8" />}
        >
          <InboxWidget disabled={disabled} filter={filter} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
