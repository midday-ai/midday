"use client";

import { useTRPC } from "@/lib/trpc-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { QueueActivityChart } from "./queue-activity-chart";
import { QueuesTable } from "./queues-table";

export function QueueOverview() {
  const trpc = useTRPC();
  const { data: queues } = useSuspenseQuery(trpc.queues.list.queryOptions());
  const { data: chartData = [] } = useSuspenseQuery(
    trpc.jobs.activity.queryOptions({ hours: 12 }),
  );

  return (
    <>
      {/* Chart Section */}
      <div className="mb-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[18px] font-normal font-serif text-primary">
            Queue Activity
          </h4>
        </div>
        <QueueActivityChart data={chartData} height={320} />
      </div>

      {/* Queues Table */}
      <QueuesTable queues={queues || []} />
    </>
  );
}
