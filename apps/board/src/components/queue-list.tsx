"use client";

import { useTRPC } from "@/lib/trpc-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { QueueCard } from "./queue-card";

export function QueueList() {
  const trpc = useTRPC();
  const { data: queues } = useSuspenseQuery(
    trpc.queues.list.queryOptions(),
  );

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
