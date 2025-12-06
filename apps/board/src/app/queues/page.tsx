import { QueueList } from "@/components/queue-list";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";

// Force dynamic rendering - this page requires runtime data from Redis
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QueuesPage() {
  // Prefetch data on the server
  try {
    await prefetch(trpc.queues.list.queryOptions());
  } catch (error) {
    // Log error but don't throw - allow page to render with empty state
    console.error("[QueuesPage] Error prefetching data:", error);
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div className="pt-6">
          <h1 className="text-[18px] font-normal font-serif text-primary mb-2">
            Queues
          </h1>
        </div>
        <Suspense
          fallback={<div className="text-muted-foreground">Loading...</div>}
        >
          <QueueList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
