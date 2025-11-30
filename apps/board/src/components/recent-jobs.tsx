"use client";

import { trpc } from "@/lib/trpc-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { JobStatus } from "./job-status";

export function RecentJobs() {
  const router = useRouter();
  const { data: jobs, isLoading } = trpc.jobs.recent.useQuery({ limit: 20 });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
          <Table>
            <TableHeader className="border-l-0 border-r-0">
              <TableRow className="h-[45px] hover:bg-transparent">
                <TableHead className="w-[200px] min-w-[200px] px-3 md:px-4 py-2">
                  Queue
                </TableHead>
                <TableHead className="w-[250px] min-w-[250px] px-3 md:px-4 py-2">
                  Job Name
                </TableHead>
                <TableHead className="w-[120px] min-w-[120px] px-3 md:px-4 py-2">
                  Status
                </TableHead>
                <TableHead className="w-[180px] min-w-[180px] px-3 md:px-4 py-2">
                  Finished
                </TableHead>
                <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                  Attempts
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-l-0 border-r-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="h-[40px] md:h-[45px]">
                  <TableCell className="px-3 md:px-4 py-2">
                    <div className="h-4 w-32 bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <div className="h-4 w-40 bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <div className="h-4 w-24 bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <div className="h-4 w-12 bg-muted animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
          <div className="text-center py-12 border-t border-border min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No recent jobs found
            </p>
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
                Queue
              </TableHead>
              <TableHead className="w-[250px] min-w-[250px] px-3 md:px-4 py-2">
                Job Name
              </TableHead>
              <TableHead className="w-[120px] min-w-[120px] px-3 md:px-4 py-2">
                Status
              </TableHead>
              <TableHead className="w-[180px] min-w-[180px] px-3 md:px-4 py-2">
                Finished
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                Attempts
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border-l-0 border-r-0">
            {jobs.map((job) => {
              const finishedTime =
                job.finishedOn || job.processedOn || job.timestamp;
              return (
                <TableRow
                  key={`${job.queueName}-${job.id}`}
                  className="group h-[40px] md:h-[45px] cursor-pointer"
                  onClick={() => {
                    router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                  }}
                >
                  <TableCell className="px-3 md:px-4 py-2">
                    <span className="text-sm text-foreground">
                      {job.queueName}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <span className="text-sm text-foreground">{job.name}</span>
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <JobStatus status={job.status} />
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                    {finishedTime
                      ? format(new Date(finishedTime), "MMM d, HH:mm:ss")
                      : "-"}
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2 text-sm text-muted-foreground">
                    {job.attemptsMade}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
