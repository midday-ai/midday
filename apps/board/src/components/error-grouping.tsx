"use client";

import { useTRPC } from "@/lib/trpc-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export function ErrorGrouping() {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: errorGroups } = useSuspenseQuery(
    trpc.jobs.errors.queryOptions({ limit: 50 }),
  );

  if (!errorGroups || errorGroups.length === 0) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
          <div className="text-center py-12 border-t border-border min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No errors found</p>
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
                Job Name
              </TableHead>
              <TableHead className="px-3 md:px-4 py-2">Error Message</TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Count
              </TableHead>
              <TableHead className="w-[150px] min-w-[150px] px-3 md:px-4 py-2">
                Queues
              </TableHead>
              <TableHead className="w-[180px] min-w-[180px] px-3 md:px-4 py-2">
                Last Occurrence
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border-l-0 border-r-0">
            {errorGroups.map((group) => (
              <TableRow
                key={group.jobName}
                className="group h-[40px] md:h-[45px] cursor-pointer"
                onClick={() => {
                  // Navigate to first recent job
                  if (group.recentJobs.length > 0) {
                    const firstJob = group.recentJobs[0];
                    router.push(
                      `/queues/${firstJob?.queueName}/jobs/${firstJob?.id}`,
                    );
                  }
                }}
              >
                <TableCell className="px-3 md:px-4 py-2">
                  <span className="text-sm text-foreground">
                    {group.jobName}
                  </span>
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2">
                  <div className="text-sm text-muted-foreground max-w-[500px] truncate">
                    {group.normalizedError}
                  </div>
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-foreground">
                  {group.count}
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {group.queues.map((queue) => (
                      <span
                        key={queue}
                        className="text-xs px-2 py-1 bg-muted rounded"
                      >
                        {queue}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                  {group.recentJobs.length > 0
                    ? format(
                        new Date(group.recentJobs[0]?.timestamp ?? 0),
                        "MMM d, HH:mm",
                      )
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
