"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { formatDate } from "@midday/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";

type AchBatchStatus =
  | "draft"
  | "validated"
  | "submitted"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

const statusStyles: Record<AchBatchStatus, string> = {
  draft: "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
  validated: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  submitted: "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  processing: "text-[#FFD02B] bg-[#FFD02B]/10 dark:bg-[#FFD02B]/10",
  completed: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  failed: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  cancelled: "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
};

const statusLabels: Record<AchBatchStatus, string> = {
  draft: "Draft",
  validated: "Validated",
  submitted: "Submitted",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

type Props = {
  onCreateNew: () => void;
  onSelectBatch: (id: string) => void;
};

export function AchBatchList({ onCreateNew, onSelectBatch }: Props) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.achBatches.getAll.queryOptions({}),
  );

  const batches = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">ACH Batches</h2>
          <p className="text-sm text-[#606060]">
            Generate and manage NACHA files for payment collection
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Icons.Add size={16} className="mr-2" />
          New Batch
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Icons.Invoice size={24} className="text-[#606060]" />
          </div>
          <h3 className="text-lg font-medium">No ACH batches yet</h3>
          <p className="mt-1 text-sm text-[#606060] max-w-[360px]">
            Create your first batch to generate a NACHA file for payment
            collection.
          </p>
          <Button className="mt-4" onClick={onCreateNew}>
            Create First Batch
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow
                key={batch.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelectBatch(batch.id)}
              >
                <TableCell className="font-mono text-sm">
                  {batch.batchNumber}
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {formatDate(batch.effectiveDate)}
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {batch.itemCount}
                </TableCell>
                <TableCell className="font-mono tabular-nums text-sm">
                  ${Number(batch.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]",
                      statusStyles[(batch.status as AchBatchStatus) || "draft"],
                    )}
                  >
                    <span className="line-clamp-1 truncate inline-block">
                      {statusLabels[(batch.status as AchBatchStatus) || "draft"]}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-sm text-[#606060]">
                  {formatDate(batch.createdAt)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Icons.ChevronRight size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
