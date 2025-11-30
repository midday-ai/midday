import { QueueList } from "@/components/queue-list";
import { RecentJobs } from "@/components/recent-jobs";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

export default async function QueuesPage() {
  // Prefetch data on the server
  prefetch(trpc.queues.list.queryOptions());
  prefetch(trpc.jobs.recent.queryOptions({ limit: 20 }));

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div className="pt-6">
          <h1 className="text-[18px] font-normal font-serif text-primary mb-2">
            Queues
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
            <QueueList />
          </Suspense>
        </div>

        <div>
          <h2 className="text-[18px] font-normal font-serif text-primary mb-4">
            Recent Jobs
          </h2>
          <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
            <RecentJobs />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
