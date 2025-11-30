"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { JobTable } from "./job-table";
import { QueueMetrics } from "./queue-metrics";

interface QueueDetailProps {
  queueName: string;
}

export function QueueDetail({ queueName }: QueueDetailProps) {
  const [selectedStatus, setSelectedStatus] = useQueryState(
    "status",
    parseAsStringLiteral([
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
    ]).withDefault("completed"),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 pt-6">
        <QueueMetrics
          queueName={queueName}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>

      <div>
        <h2 className="text-[18px] font-normal font-serif text-primary mb-4 capitalize">
          {selectedStatus}
        </h2>
        <JobTable queueName={queueName} status={selectedStatus} />
      </div>
    </div>
  );
}
