"use client";

import { ErrorFallback } from "@/components/error-fallback";
import { InboxListSkeleton } from "@/components/inbox/inbox-list-skeleton";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense, useState } from "react";
import type { InboxOption } from "./data";
import { InboxHeader } from "./inbox-header";
import { InboxWidget } from "./inbox-widget";

type Props = {
  disabled: boolean;
};

export function Inbox({ disabled }: Props) {
  const [filter, setFilter] = useState<InboxOption>("all");

  return (
    <div className="border relative aspect-square overflow-hidden p-4 md:p-8">
      <InboxHeader filter={filter} disabled={disabled} setFilter={setFilter} />

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense
          fallback={<InboxListSkeleton numberOfItems={5} className="pt-8" />}
        >
          <InboxWidget filter={filter} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
