"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useRouter } from "next/navigation";

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  total: number;
}

interface Queue {
  name: string;
  metrics: QueueMetrics;
}

interface QueuesTableProps {
  queues: Queue[];
}

export function QueuesTable({ queues }: QueuesTableProps) {
  const router = useRouter();

  if (!queues || queues.length === 0) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
          <div className="text-center py-12 border-t border-border min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No queues found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader className="border-l-0 border-r-0">
            <TableRow className="h-[45px] hover:bg-transparent">
              <TableHead className="w-[200px] min-w-[200px] px-3 md:px-4 py-2">
                Name
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Waiting
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Active
              </TableHead>
              <TableHead className="w-[120px] min-w-[120px] px-3 md:px-4 py-2">
                Completed
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Failed
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Delayed
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Total
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border-l-0 border-r-0">
            {queues.map((queue) => (
              <TableRow
                key={queue.name}
                className="group h-[40px] md:h-[45px] cursor-pointer"
                onClick={() => {
                  router.push(`/queues/${queue.name}`);
                }}
              >
                <TableCell className="px-3 md:px-4 py-2">
                  <span className="text-sm text-foreground font-medium">
                    {queue.name}
                  </span>
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                  {queue.metrics.waiting}
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                  {queue.metrics.active}
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                  {queue.metrics.completed}
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                  {queue.metrics.failed}
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                  {queue.metrics.delayed}
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2">
                  <span className="text-sm text-foreground font-medium">
                    {queue.metrics.total}
                  </span>
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2">
                  {queue.metrics.paused ? (
                    <span className="text-xs text-muted-foreground">
                      Paused
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Active
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
