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

interface JobTableProps {
  queueName: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
}

export function JobTable({ queueName, status }: JobTableProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery(
    searchQuery
      ? trpc.jobs.search.queryOptions({
          query: searchQuery,
          queueName,
          status,
          page: 1,
          pageSize: 50,
        })
      : trpc.jobs.list.queryOptions({
          queueName,
          status,
          page: 1,
          pageSize: 50,
        }),
  );

  const jobs = searchQuery ? data?.jobs || [] : data?.jobs || [];

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map((job) => job.id)));
    }
  };

  const allSelected = jobs.length > 0 && selectedJobIds.size === jobs.length;
  const someSelected =
    selectedJobIds.size > 0 && selectedJobIds.size < jobs.length;

  if (isLoading) {
    return (
      <div className="w-full">
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
                <TableHead className="w-[200px] min-w-[200px] px-3 md:px-4 py-2">
                  ID
                </TableHead>
                <TableHead className="w-[250px] min-w-[250px] px-3 md:px-4 py-2">
                  Name
                </TableHead>
                <TableHead className="w-[180px] min-w-[180px] px-3 md:px-4 py-2">
                  Created
                </TableHead>
                <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                  Attempts
                </TableHead>
                {status === "failed" && (
                  <TableHead className="w-[300px] min-w-[300px] px-3 md:px-4 py-2">
                    Error
                  </TableHead>
                )}
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
                    <div className="h-4 w-24 bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell className="px-3 md:px-4 py-2">
                    <div className="h-4 w-12 bg-muted animate-pulse" />
                  </TableCell>
                  {status === "failed" && (
                    <TableCell className="px-3 md:px-4 py-2">
                      <div className="h-4 w-48 bg-muted animate-pulse" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
          <div className="text-center py-12 border-t border-border min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No jobs found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <JobSearch
          onSearch={setSearchQuery}
          placeholder="Search by job name, ID, or error..."
        />
      </div>
      {selectedJobIds.size > 0 && (
        <BulkActions
          selectedJobIds={Array.from(selectedJobIds)}
          queueName={queueName}
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
                  : "No jobs found"}
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
                <TableHead className="w-[200px] min-w-[200px] px-3 md:px-4 py-2">
                  ID
                </TableHead>
                <TableHead className="w-[250px] min-w-[250px] px-3 md:px-4 py-2">
                  Name
                </TableHead>
                <TableHead className="w-[180px] min-w-[180px] px-3 md:px-4 py-2">
                  Created
                </TableHead>
                <TableHead className="w-[100px] min-w-[100px] px-3 md:px-4 py-2">
                  Attempts
                </TableHead>
                {status === "failed" && (
                  <TableHead className="w-[300px] min-w-[300px] px-3 md:px-4 py-2">
                    Error
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="border-l-0 border-r-0">
              {jobs.map((job) => {
                const isSelected = selectedJobIds.has(job.id);
                return (
                  <TableRow key={job.id} className="group h-[40px] md:h-[45px]">
                    <TableCell
                      className="px-3 md:px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleJobSelection(job.id)}
                        aria-label={`Select job ${job.id}`}
                      />
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${queueName}/jobs/${job.id}`);
                      }}
                    >
                      <span className="text-sm font-sans text-foreground">
                        {job.id}
                      </span>
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 text-sm cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${queueName}/jobs/${job.id}`);
                      }}
                    >
                      {job.name}
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 text-sm text-muted-foreground cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${queueName}/jobs/${job.id}`);
                      }}
                    >
                      {format(new Date(job.timestamp), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell
                      className="px-3 md:px-4 py-2 text-sm text-muted-foreground cursor-pointer"
                      onClick={() => {
                        router.push(`/queues/${queueName}/jobs/${job.id}`);
                      }}
                    >
                      {job.attemptsMade}
                    </TableCell>
                    {status === "failed" && (
                      <TableCell
                        className="px-3 md:px-4 py-2 text-sm text-muted-foreground max-w-[300px] truncate cursor-pointer"
                        onClick={() => {
                          router.push(`/queues/${queueName}/jobs/${job.id}`);
                        }}
                      >
                        {job.failedReason}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {searchQuery && data && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Found {data.total} job{data.total !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
