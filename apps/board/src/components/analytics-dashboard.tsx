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

export function AnalyticsDashboard() {
  const trpc = useTRPC();
  const { data: analytics } = useSuspenseQuery(
    trpc.jobs.analytics.queryOptions({ hours: 24 }),
  );

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Loading analytics...</p>
      </div>
    );
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-8">
      {/* Throughput */}
      <div>
        <h3 className="text-lg font-medium mb-4">Queue Throughput</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>Jobs/Hour</TableHead>
                <TableHead>Total Jobs ({analytics.timeWindowHours}h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.throughput.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                analytics.throughput.map((t) => (
                  <TableRow key={t.queueName}>
                    <TableCell>{t.queueName}</TableCell>
                    <TableCell>{t.jobsPerHour.toFixed(2)}</TableCell>
                    <TableCell>{t.totalJobs}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Top Slowest Jobs */}
      <div>
        <h3 className="text-lg font-medium mb-4">Top Slowest Jobs (P95)</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>P95 Duration</TableHead>
                <TableHead>Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topSlowest.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                analytics.topSlowest.map((job) => (
                  <TableRow key={job.name}>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>{formatDuration(job.p95Duration)}</TableCell>
                    <TableCell>{formatDuration(job.avgDuration)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Top Failing Jobs */}
      <div>
        <h3 className="text-lg font-medium mb-4">Top Failing Jobs</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Failed Jobs</TableHead>
                <TableHead>Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topFailing.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                analytics.topFailing.map((job) => (
                  <TableRow key={job.name}>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>{job.failedJobs}</TableCell>
                    <TableCell>{job.successRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Job Metrics */}
      <div>
        <h3 className="text-lg font-medium mb-4">Job Performance Metrics</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Avg Duration</TableHead>
                <TableHead>P95 Duration</TableHead>
                <TableHead>P99 Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.jobMetrics.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                analytics.jobMetrics.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell>{metric.name}</TableCell>
                    <TableCell>{metric.totalJobs}</TableCell>
                    <TableCell>{metric.completedJobs}</TableCell>
                    <TableCell>{metric.failedJobs}</TableCell>
                    <TableCell>{metric.successRate.toFixed(1)}%</TableCell>
                    <TableCell>
                      {metric.avgDuration > 0
                        ? formatDuration(metric.avgDuration)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {metric.p95Duration > 0
                        ? formatDuration(metric.p95Duration)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {metric.p99Duration > 0
                        ? formatDuration(metric.p99Duration)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
