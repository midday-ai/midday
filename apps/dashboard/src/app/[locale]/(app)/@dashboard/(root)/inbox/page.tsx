import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

export default function InboxPage({ searchParams }) {
  return (
    <div className="flex-col flex">
      <Suspense fallback={<InboxViewSkeleton />}>
        <Inbox selectedId={searchParams?.id} />
      </Suspense>
    </div>
  );
}
