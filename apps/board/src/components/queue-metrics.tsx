"use client";

import { trpc } from "@/lib/trpc-react";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";

interface QueueMetricsProps {
  queueName: string;
  selectedStatus?: "waiting" | "active" | "completed" | "failed" | "delayed";
  onStatusChange?: (
    status: "waiting" | "active" | "completed" | "failed" | "delayed",
  ) => void;
}

export function QueueMetrics({
  queueName,
  selectedStatus,
  onStatusChange,
}: QueueMetricsProps) {
  const { data: queue, isLoading } = trpc.queues.get.useQuery({
    name: queueName,
  });

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4, 5].map((i) => (
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

  if (!queue) {
    return null;
  }

  const metrics = [
    {
      title: "Completed",
      status: "completed" as const,
      value: queue.metrics.completed,
      description: "Jobs completed",
    },
    {
      title: "Waiting",
      status: "waiting" as const,
      value: queue.metrics.waiting,
      description: "Jobs waiting",
    },
    {
      title: "Active",
      status: "active" as const,
      value: queue.metrics.active,
      description: "Jobs processing",
    },
    {
      title: "Failed",
      status: "failed" as const,
      value: queue.metrics.failed,
      description: "Jobs failed",
    },
    {
      title: "Delayed",
      status: "delayed" as const,
      value: queue.metrics.delayed,
      description: "Jobs delayed",
    },
  ];

  return (
    <>
      {metrics.map((metric) => {
        const isSelected = selectedStatus === metric.status;
        const Component = onStatusChange ? "button" : "div";

        return (
          <Component
            key={metric.title}
            type={onStatusChange ? "button" : undefined}
            onClick={() => onStatusChange?.(metric.status)}
            className={cn(
              "hidden sm:block text-left w-full",
              onStatusChange && "cursor-pointer",
            )}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-2xl font-serif">
                  {metric.value}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-2">
                  <div>{metric.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {metric.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Component>
        );
      })}
    </>
  );
}
