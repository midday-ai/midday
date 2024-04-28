import { Inbox } from "@/components/inbox";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

export default async function InboxPage() {
  return (
    <Suspense fallback={<InboxViewSkeleton />}>
      <Inbox />
    </Suspense>
  );
}
