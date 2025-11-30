import { QueueOverview } from "@/components/queue-overview";
import { QueueOverviewSkeleton } from "@/components/queue-overview-skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

export default async function HomePage() {
  // Prefetch queue data on the server
  prefetch(trpc.queues.list.queryOptions());
  prefetch(trpc.jobs.recent.queryOptions({ limit: 20 }));

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
