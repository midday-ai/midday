"use client";

import { trpc } from "@/lib/trpc-react";
import { QueueCard } from "./queue-card";

export function QueueList() {
  const { data: queues, isLoading } = trpc.queues.list.useQuery();

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border bg-background text-card-foreground">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="h-[30px] w-32 bg-muted animate-pulse" />
            </div>
            <div className="p-6 pt-0">
              <div className="h-5 w-16 bg-muted animate-pulse mb-2" />
              <div className="h-4 w-24 bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (!queues || queues.length === 0) {
    return <div className="text-muted-foreground">No queues found</div>;
  }

  return (
    <>
      {queues.map((queue) => (
        <QueueCard key={queue.name} name={queue.name} metrics={queue.metrics} />
      ))}
    </>
  );
}
