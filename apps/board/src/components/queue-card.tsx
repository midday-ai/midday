"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import Link from "next/link";

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  total: number;
}

interface QueueCardProps {
  name: string;
  metrics: QueueMetrics;
}

export function QueueCard({ name, metrics }: QueueCardProps) {
  return (
    <Link href={`/queues/${name}`} className="hidden sm:block text-left">
      <Card className="hover:bg-muted transition-colors">
        <CardHeader className="pb-2 flex flex-row items-center">
          <CardTitle className="font-medium text-2xl font-serif">
            {metrics.total}
          </CardTitle>
          {metrics.paused && (
            <span className="ml-2 text-xs text-muted-foreground">Paused</span>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-2">
            <div>{name}</div>
            <div className="text-sm text-muted-foreground">
              {metrics.waiting} waiting, {metrics.active} active,{" "}
              {metrics.completed} completed, {metrics.failed} failed
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
