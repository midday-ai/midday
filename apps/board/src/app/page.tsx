import { QueueOverview } from "@/components/queue-overview";
import { QueueOverviewSkeleton } from "@/components/queue-overview-skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

// Force dynamic rendering - this page requires runtime data from Redis
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  // Prefetch queue data on the server
  // Wrap in try/catch to prevent errors from bubbling up and being redacted
  try {
    await Promise.all([
      prefetch(trpc.queues.list.queryOptions()),
      prefetch(trpc.jobs.recent.queryOptions({ limit: 20 })),
    ]);
  } catch (error) {
    // Log error but don't throw - allow page to render with empty state
    console.error("[HomePage] Error prefetching data:", error);
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <Suspense fallback={<QueueOverviewSkeleton />}>
          <QueueOverview />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
