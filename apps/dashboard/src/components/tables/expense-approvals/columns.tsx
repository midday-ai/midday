"use client";

import { ExpenseApprovalStatus } from "@/components/expense-approval-status";
import { FormatAmount } from "@/components/format-amount";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Checkbox } from "@midday/ui/checkbox";
import { formatDate } from "@midday/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { ActionsMenu } from "./actions-menu";

export type ExpenseApproval = NonNullable<
  RouterOutputs["expenseApprovals"]["list"]["data"]
>[number];

// Type for expense approval status values
type ExpenseApprovalStatusType =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export const columns: ColumnDef<ExpenseApproval>[] = [
  {
    id: "select",
    size: 50,
    minSize: 50,
    maxSize: 50,
    enableResizing: false,
    enableHiding: false,
    enableSorting: false,
    meta: {
      sticky: true,
      skeleton: { type: "checkbox" },
      className:
        "w-[50px] min-w-[50px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => {
          if (checked === "indeterminate") {
            row.toggleSelected();
          } else {
            row.toggleSelected(checked);
          }
        }}
      />
    ),
  },
  {
    id: "requester",
    header: "申請者",
    accessorKey: "requester",
    size: 180,
    minSize: 140,
    maxSize: 300,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "avatar-text", width: "w-24" },
      headerLabel: "申請者",
      className:
        "w-[180px] min-w-[140px] md:sticky md:left-[50px] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => {
      const requester = row.original.requester;
      if (!requester) return "-";

      return (
        <div className="flex items-center space-x-2 min-w-0">
          <Avatar className="size-5 flex-shrink-0">
            <AvatarFallback className="text-[9px] font-medium">
              {requester.fullName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            {requester.fullName || requester.email}
          </span>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "ステータス",
    accessorKey: "status",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge", width: "w-16" },
      headerLabel: "ステータス",
      sortField: "status",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as ExpenseApprovalStatusType;
      return <ExpenseApprovalStatus status={status} />;
    },
  },
  {
    id: "amount",
    header: "金額",
    accessorKey: "amount",
    size: 140,
    minSize: 100,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "金額",
      sortField: "amount",
      className: "w-[140px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const amount = row.original.amount;
      const currency = row.original.currency;
      if (!amount) return "-";
      return (
        <span className="truncate">
          <FormatAmount amount={amount} currency={currency ?? "JPY"} />
        </span>
      );
    },
  },
  {
    id: "note",
    header: "備考",
    accessorKey: "note",
    size: 200,
    minSize: 150,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "備考",
      className: "w-[200px] min-w-[150px]",
    },
    cell: ({ row }) => {
      const note = row.original.note;
      return <span className="truncate">{note || "-"}</span>;
    },
  },
  {
    id: "submittedAt",
    header: "申請日",
    accessorKey: "submittedAt",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "申請日",
      sortField: "submitted_at",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row, table }) => {
      const date = row.original.submittedAt;
      return (
        <span className="truncate">
          {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    id: "approver",
    header: "承認者",
    accessorKey: "approver",
    size: 160,
    minSize: 120,
    maxSize: 260,
    enableResizing: true,
    meta: {
      skeleton: { type: "avatar-text", width: "w-20" },
      headerLabel: "承認者",
      className: "w-[160px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const approver = row.original.approver;
      if (!approver || !approver.id) return "-";

      return (
        <div className="flex items-center space-x-2 min-w-0">
          <Avatar className="size-5 flex-shrink-0">
            <AvatarFallback className="text-[9px] font-medium">
              {approver.fullName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            {approver.fullName || approver.email}
          </span>
        </div>
      );
    },
  },
  {
    id: "approvedAt",
    header: "承認日",
    accessorKey: "approvedAt",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "承認日",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row, table }) => {
      const approvedAt = row.original.approvedAt;
      const rejectedAt = row.original.rejectedAt;
      const date = approvedAt || rejectedAt;
      return (
        <span className="truncate">
          {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "操作",
    size: 100,
    minSize: 80,
    maxSize: 100,
    enableResizing: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "操作",
      className:
        "w-[100px] min-w-[80px] md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row }) => {
      return <ActionsMenu row={row.original} />;
    },
  },
];
