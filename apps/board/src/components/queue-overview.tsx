"use client";

import { useTRPC } from "@/lib/trpc-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { QueueActivityChart } from "./queue-activity-chart";
import { QueueCard } from "./queue-card";

export function QueueOverview() {
  const trpc = useTRPC();
  const { data: queues } = useSuspenseQuery(trpc.queues.list.queryOptions());

  // Generate mock chart data for now (can be enhanced with real time-series data)
  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      data.push({
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        completed: Math.floor(Math.random() * 50) + 10,
        failed: Math.floor(Math.random() * 5),
        active: Math.floor(Math.random() * 10),
      });
    }
    return data;
  }, []);

  if (!queues || queues.length === 0) {
    return <div className="text-muted-foreground">No queues found</div>;
  }

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

      {/* Queue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {queues.map((queue) => (
          <QueueCard
            key={queue.name}
            name={queue.name}
            metrics={queue.metrics}
          />
        ))}
      </div>
    </>
  );
}
