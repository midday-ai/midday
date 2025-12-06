"use client";

import { useTRPC } from "@/lib/trpc-react";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BulkActions } from "./bulk-actions";
import { JobSearch } from "./job-search";
import { JobStatus } from "./job-status";

export function RunsTable() {
  const router = useRouter();
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const searchQueryResult = useQuery({
    ...trpc.jobs.search.queryOptions({
      query: searchQuery,
      page: 1,
      pageSize: 50,
    }),
    enabled: !!searchQuery,
  });

  const recentQueryResult = useQuery({
    ...trpc.jobs.recent.queryOptions({ limit: 50 }),
    enabled: !searchQuery,
  });

  const isLoading = searchQuery
    ? searchQueryResult.isLoading
    : recentQueryResult.isLoading;

  const jobs = searchQuery
    ? searchQueryResult.data?.jobs || []
    : recentQueryResult.data || [];

  const searchTotal = searchQueryResult.data?.total;

  const toggleJobSelection = (jobId: string, queueName: string) => {
    const key = `${queueName}-${jobId}`;
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(
        new Set(jobs.map((job) => `${job.queueName}-${job.id}`)),
      );
    }
  };

  const allSelected = jobs.length > 0 && selectedJobIds.size === jobs.length;
  const someSelected =
    selectedJobIds.size > 0 && selectedJobIds.size < jobs.length;

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

  // Extract job IDs and queue names for bulk operations
  const bulkJobData = Array.from(selectedJobIds)
    .map((key) => {
      const parts = key.split("-");
      if (parts.length < 2) return null;
      const jobId = parts.slice(1).join("-"); // Handle IDs that might contain dashes
      const queueName = parts[0];
      return { queueName, jobId };
    })
    .filter(
      (item): item is { queueName: string; jobId: string } => item !== null,
    );

  // Group jobs by queue for bulk operations
  const jobsByQueue = new Map<string, string[]>();
  for (const { queueName, jobId } of bulkJobData) {
    if (queueName && jobId) {
      if (!jobsByQueue.has(queueName)) {
        jobsByQueue.set(queueName, []);
      }
      jobsByQueue.get(queueName)!.push(jobId);
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <JobSearch
          onSearch={setSearchQuery}
          placeholder="Search by job name, ID, queue, or error..."
        />
      </div>
      {selectedJobIds.size > 0 && (
        <BulkActions
          selectedJobIds={bulkJobData.map((d) => d.jobId)}
          jobsByQueue={jobsByQueue}
          onClearSelection={() => setSelectedJobIds(new Set())}
        />
      )}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      )}
      {!isLoading && jobs.length === 0 && (
        <div className="w-full">
          <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
            <div className="text-center py-12 border-t border-border min-h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "No jobs found matching your search"
                  : "No recent jobs found"}
              </p>
            </div>
          </div>
        </div>
      )}
      {!isLoading && jobs.length > 0 && (
        <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
          <Table>
            <TableHeader className="border-l-0 border-r-0">
              <TableRow className="h-[45px] hover:bg-transparent">
                <TableHead className="w-[50px] min-w-[50px] px-3 md:px-4 py-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAllSelection}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[120px] min-w-[120px] px-3 md:px-4 py-2">
                  ID
                </TableHead>
                <TableHead className="w-[250px] min-w-[250px] px-3 md:px-4 py-2">
                  Name
                </TableHead>
                <TableHead className="w-[120px] min-w-[120px] px-3 md:px-4 py-2">
                  Status
                </TableHead>
                <TableHead className="w-[180px] min-w-[180px] px-3 md:px-4 py-2">
                  Started
                </TableHead>
                <TableHead className="w-[120px] min-w-[120px] px-3 md:px-4 py-2">
                  Duration
                </TableHead>
                <TableHead className="w-[200px] min-w-[200px] px-3 md:px-4 py-2">
                  Queue
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-l-0 border-r-0">
              {jobs.map((job) => {
                const jobKey = `${job.queueName}-${job.id}`;
                const isSelected = selectedJobIds.has(jobKey);
                return (
                  <TableRow key={jobKey} className="group h-[40px] md:h-[45px]">
                    <TableCell
                      className="px-3 md:px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleJobSelection(job.id, job.queueName)
                        }
                        aria-label={`Select job ${job.id}`}
                      />
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                      }}
                    >
                      <span className="text-sm text-foreground font-mono">
                        {job.id}
                      </span>
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                      }}
                    >
                      <span className="text-sm text-foreground">
                        {job.name}
                      </span>
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                      }}
                    >
                      <JobStatus status={job.status} />
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 text-sm text-muted-foreground cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                      }}
                    >
                      {job.started
                        ? format(new Date(job.started), "MMM d, HH:mm:ss")
                        : "-"}
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 text-sm text-muted-foreground cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                      }}
                    >
                      {job.duration !== null ? `${job.duration}ms` : "-"}
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${job.queueName}/jobs/${job.id}`);
                      }}
                    >
                      <span className="text-sm text-foreground">
                        {job.queueName}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {searchQuery && searchTotal !== undefined && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Found {searchTotal} job{searchTotal !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
