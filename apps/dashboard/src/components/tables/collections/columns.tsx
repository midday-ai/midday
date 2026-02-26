"use client";

import { FormatAmount } from "@/components/format-amount";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { memo, useCallback } from "react";

export type CollectionCase =
  RouterOutputs["collections"]["get"]["data"][number];

// --- Memoized Cell Components ---

const MerchantCell = memo(
  ({
    merchantName,
    dealCode,
  }: {
    merchantName: string | null;
    dealCode: string | null;
  }) => {
    if (!merchantName) return "-";
    return (
      <div className="flex flex-col min-w-0">
        <span className="truncate font-medium text-sm">{merchantName}</span>
        {dealCode && (
          <span className="truncate text-xs text-[#878787]">{dealCode}</span>
        )}
      </div>
    );
  },
);
MerchantCell.displayName = "MerchantCell";

const BalanceCell = memo(({ balance }: { balance: number | null }) => {
  if (!balance || balance <= 0) return "-";
  return (
    <span className="font-mono text-sm">
      <FormatAmount amount={balance} currency="USD" />
    </span>
  );
});
BalanceCell.displayName = "BalanceCell";

const stageColorMap: Record<string, string> = {
  // Midday palette (preferred)
  "#FF3638": "text-[#FF3638] bg-[#FF3638]/10",
  "#F97316": "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  "#FFD02B": "text-[#FFD02B] bg-[#FFD02B]/10",
  "#00C969": "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  "#1F6FEB": "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  "#878787": "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
  // Legacy Tailwind defaults (backward compat with existing DB data)
  "#ef4444": "text-[#FF3638] bg-[#FF3638]/10",
  "#f97316": "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  "#eab308": "text-[#FFD02B] bg-[#FFD02B]/10",
  "#22c55e": "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  "#3b82f6": "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  "#8b5cf6": "text-[#1F6FEB] bg-[#DDEBFF] dark:bg-[#1F6FEB]/10",
  "#6b7280": "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
};

const StageCell = memo(
  ({
    stageName,
    stageColor,
  }: {
    stageName: string | null;
    stageColor: string | null;
  }) => {
    if (!stageName) return "-";
    const colorClass =
      stageColorMap[stageColor || ""] ||
      "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]";
    return (
      <div
        className={cn(
          "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px] font-medium",
          colorClass,
        )}
      >
        <span className="line-clamp-1 truncate inline-block">{stageName}</span>
      </div>
    );
  },
);
StageCell.displayName = "StageCell";

const priorityStyles: Record<string, string> = {
  critical: "text-[#FF3638] bg-[#FF3638]/10",
  high: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  medium: "text-[#FFD02B] bg-[#FFD02B]/10",
  low: "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
};

const PriorityCell = memo(({ priority }: { priority: string | null }) => {
  if (!priority) return "-";
  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px] font-medium",
        priorityStyles[priority] || priorityStyles.low,
      )}
    >
      <span className="line-clamp-1 truncate inline-block capitalize">
        {priority}
      </span>
    </div>
  );
});
PriorityCell.displayName = "PriorityCell";

const AssignedToCell = memo(
  ({
    name,
    avatarUrl,
  }: {
    name: string | null;
    avatarUrl: string | null;
  }) => {
    if (!name) {
      return (
        <div className="text-[#FF3638] bg-[#FF3638]/10 px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px]">
          <span className="line-clamp-1 truncate inline-block">Unassigned</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <Avatar className="size-5">
          {avatarUrl && (
            <AvatarImageNext
              src={avatarUrl}
              alt={name}
              width={20}
              height={20}
              quality={100}
            />
          )}
          <AvatarFallback className="text-[9px] font-medium">
            {name[0]}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm">{name}</span>
      </div>
    );
  },
);
AssignedToCell.displayName = "AssignedToCell";

const FollowUpCell = memo(
  ({ nextFollowUp }: { nextFollowUp: string | null }) => {
    if (!nextFollowUp) return "-";
    const date = new Date(nextFollowUp);
    const isOverdue = date < new Date();
    return (
      <span
        className={cn(
          "text-sm",
          isOverdue && "text-[#FF3638] font-medium",
        )}
      >
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    );
  },
);
FollowUpCell.displayName = "FollowUpCell";

const DaysInStageCell = memo(
  ({ daysInStage }: { daysInStage: number | null }) => {
    if (daysInStage == null) return "-";
    return <span className="font-mono text-sm">{daysInStage}d</span>;
  },
);
DaysInStageCell.displayName = "DaysInStageCell";

const ActionsCell = memo(
  ({ caseId }: { caseId: string }) => {
    return (
      <div className="flex items-center justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="relative">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/collections/${caseId}`}>View Details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);
ActionsCell.displayName = "ActionsCell";

// --- Column Definitions ---

export const columns: ColumnDef<CollectionCase>[] = [
  {
    id: "merchant",
    accessorKey: "merchantName",
    header: "Merchant",
    size: 240,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Merchant",
      className:
        "w-[240px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <MerchantCell
        merchantName={row.original.merchantName}
        dealCode={row.original.dealCode}
      />
    ),
  },
  {
    id: "balance",
    accessorKey: "currentBalance",
    header: "Balance",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Balance",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <BalanceCell balance={Number(row.original.currentBalance)} />
    ),
  },
  {
    id: "stage",
    accessorKey: "stageName",
    header: "Stage",
    size: 140,
    minSize: 110,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Stage",
      className: "w-[140px] min-w-[110px]",
    },
    cell: ({ row }) => (
      <StageCell
        stageName={row.original.stageName}
        stageColor={row.original.stageColor}
      />
    ),
  },
  {
    id: "assignedTo",
    accessorKey: "assignedToName",
    header: "Assigned To",
    size: 160,
    minSize: 130,
    maxSize: 240,
    enableResizing: true,
    meta: {
      skeleton: { type: "avatar-text", width: "w-24" },
      headerLabel: "Assigned To",
      className: "w-[160px] min-w-[130px]",
    },
    cell: ({ row }) => (
      <AssignedToCell
        name={row.original.assignedToName}
        avatarUrl={row.original.assignedToAvatar}
      />
    ),
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    size: 100,
    minSize: 80,
    maxSize: 140,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-14" },
      headerLabel: "Priority",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => <PriorityCell priority={row.original.priority} />,
  },
  {
    id: "nextFollowUp",
    accessorKey: "nextFollowUp",
    header: "Follow-up",
    size: 130,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Follow-up",
      className: "w-[130px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <FollowUpCell nextFollowUp={row.original.nextFollowUp} />
    ),
  },
  {
    id: "daysInStage",
    accessorKey: "daysInStage",
    header: "Days in Stage",
    size: 110,
    minSize: 90,
    maxSize: 140,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-12" },
      headerLabel: "Days in Stage",
      className: "w-[110px] min-w-[90px]",
    },
    cell: ({ row }) => (
      <DaysInStageCell daysInStage={row.original.daysInStage} />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    minSize: 80,
    maxSize: 80,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row }) => <ActionsCell caseId={row.original.id} />,
  },
];
