"use client";

import { useTRPC } from "@/lib/trpc-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { QueuesTable } from "./queues-table";

export function QueueList() {
  const trpc = useTRPC();
  const { data: queues } = useSuspenseQuery(trpc.queues.list.queryOptions());

  return <QueuesTable queues={queues || []} />;
}
