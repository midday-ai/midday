"use client";

import { FormatAmount } from "@/components/format-amount";
import { SyndicationTransactionTypeBadge } from "@/components/syndication-transaction-type-badge";
import { cn } from "@midday/ui/cn";
import { Checkbox } from "@midday/ui/checkbox";
import { formatDate } from "@midday/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { memo } from "react";
import type { SyndicationTransaction } from "./syndication-data-table";

const CREDIT_TYPES = new Set(["contribution", "refund"]);

const statusStyles: Record<string, string> = {
  completed: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  pending:
    "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  failed:
    "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  reversed:
    "text-[#878787] bg-[#F2F1EF] dark:text-[#878787] dark:bg-[#1D1D1D]",
};

const methodLabels: Record<string, string> = {
  ach: "ACH",
  wire: "Wire",
  check: "Check",
  zelle: "Zelle",
  other: "Other",
};

const SelectCell = memo(
  ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <Checkbox checked={checked} onCheckedChange={onChange} />
  ),
);
SelectCell.displayName = "SelectCell";

export const syndicationColumns: ColumnDef<SyndicationTransaction>[] = [
  {
    id: "select",
    size: 30,
    minSize: 30,
    maxSize: 30,
    enableResizing: false,
    meta: { sticky: true, className: "pl-3 pr-1" },
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <SelectCell
        checked={row.getIsSelected()}
        onChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    id: "date",
    accessorKey: "date",
    size: 100,
    minSize: 90,
    meta: { sticky: true },
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {formatDate(row.original.date)}
      </span>
    ),
  },
  {
    id: "syndicator",
    accessorKey: "syndicatorName",
    size: 160,
    minSize: 120,
    meta: { sticky: true },
    header: "Syndicator",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm truncate">{row.original.syndicatorName}</span>
        {row.original.syndicatorCompanyName && (
          <span className="text-xs text-[#878787] truncate">
            {row.original.syndicatorCompanyName}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "type",
    accessorKey: "transactionType",
    size: 110,
    minSize: 90,
    header: "Type",
    cell: ({ row }) => (
      <SyndicationTransactionTypeBadge type={row.original.transactionType} />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    size: 250,
    minSize: 150,
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm truncate text-[#606060]">
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    id: "deal",
    accessorKey: "dealCode",
    size: 130,
    minSize: 100,
    header: "Deal",
    cell: ({ row }) =>
      row.original.dealCode ? (
        <span className="text-sm font-mono text-[#606060]">
          {row.original.dealCode}
        </span>
      ) : (
        <span className="text-xs text-[#878787]">-</span>
      ),
  },
  {
    id: "method",
    accessorKey: "method",
    size: 80,
    minSize: 60,
    header: "Method",
    cell: ({ row }) => (
      <span className="text-sm text-[#606060]">
        {row.original.method ? methodLabels[row.original.method] || row.original.method : "-"}
      </span>
    ),
  },
  {
    id: "amount",
    accessorKey: "amount",
    size: 120,
    minSize: 100,
    header: () => <span className="w-full text-right block">Amount</span>,
    cell: ({ row }) => {
      const isCredit = CREDIT_TYPES.has(row.original.transactionType);
      const displayAmount = isCredit
        ? Number(row.original.amount)
        : -Number(row.original.amount);

      return (
        <div className={cn("text-right w-full text-sm tabular-nums font-mono", isCredit ? "text-[#00C969]" : "")}>
          <FormatAmount
            amount={displayAmount}
            currency={row.original.currency}
          />
        </div>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    size: 100,
    minSize: 80,
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status ?? "completed";
      return (
        <div
          className={cn(
            "px-2 py-0.5 rounded-full inline-flex text-[11px] capitalize",
            statusStyles[status] ?? statusStyles.completed,
          )}
        >
          {status}
        </div>
      );
    },
  },
];
