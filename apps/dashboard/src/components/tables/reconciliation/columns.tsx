"use client";

import { FormatAmount } from "@/components/format-amount";
import { MatchConfidenceBar } from "@/components/match-confidence-bar";
import { MatchStatusBadge } from "@/components/match-status-badge";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { formatDate } from "@midday/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { memo } from "react";

type PaymentFeedItem =
  RouterOutputs["reconciliation"]["getPaymentFeed"]["data"][number];

const SelectCell = memo(
  ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <Checkbox checked={checked} onCheckedChange={onChange} />
  ),
);
SelectCell.displayName = "SelectCell";

const DateCell = memo(({ date }: { date: string }) => (
  <span className="text-sm tabular-nums">{formatDate(date)}</span>
));
DateCell.displayName = "DateCell";

const DescriptionCell = memo(
  ({
    name,
    counterpartyName,
    amount,
  }: {
    name: string;
    counterpartyName?: string | null;
    amount: number;
  }) => (
    <div className="flex flex-col">
      <span
        className={cn(
          "line-clamp-1 text-sm",
          amount > 0 && "text-[#00C969]",
        )}
      >
        {name}
      </span>
      {counterpartyName && (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {counterpartyName}
        </span>
      )}
    </div>
  ),
);
DescriptionCell.displayName = "DescriptionCell";

const MatchRuleCell = memo(
  ({ rule, dealCode }: { rule?: string | null; dealCode?: string | null }) => {
    if (!rule && !dealCode) {
      return <span className="text-muted-foreground text-xs">-</span>;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] cursor-help">
            {dealCode ? `Deal ${dealCode}` : rule}
          </span>
        </TooltipTrigger>
        {rule && (
          <TooltipContent className="max-w-[300px]">
            <p className="text-xs">{rule}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  },
);
MatchRuleCell.displayName = "MatchRuleCell";

export const columns: ColumnDef<PaymentFeedItem>[] = [
  {
    id: "select",
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <SelectCell
        checked={row.getIsSelected()}
        onChange={(value) => row.toggleSelected(value)}
      />
    ),
  },
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    size: 100,
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    id: "description",
    accessorKey: "name",
    header: "Description",
    size: 250,
    cell: ({ row }) => (
      <DescriptionCell
        name={row.original.name}
        counterpartyName={row.original.counterpartyName}
        amount={row.original.amount}
      />
    ),
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    size: 120,
    cell: ({ row }) => (
      <FormatAmount
        amount={row.original.amount}
        currency={row.original.currency}
      />
    ),
  },
  {
    id: "matchStatus",
    accessorKey: "matchStatus",
    header: "Status",
    size: 130,
    cell: ({ row }) => (
      <MatchStatusBadge status={row.original.matchStatus} />
    ),
  },
  {
    id: "matchedDeal",
    header: "Matched Deal",
    size: 160,
    cell: ({ row }) => (
      <MatchRuleCell
        rule={row.original.matchRule}
        dealCode={row.original.matchedDealCode}
      />
    ),
  },
  {
    id: "confidence",
    accessorKey: "matchConfidence",
    header: "Confidence",
    size: 120,
    cell: ({ row }) => (
      <MatchConfidenceBar confidence={row.original.matchConfidence} />
    ),
  },
  {
    id: "bankAccount",
    header: "Bank",
    size: 120,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground line-clamp-1">
        {row.original.bankAccountName || "-"}
      </span>
    ),
  },
  {
    id: "actions",
    size: 50,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const status = row.original.matchStatus;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icons.MoreHoriz size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === "suggested" && (
              <DropdownMenuItem>
                Confirm Match
              </DropdownMenuItem>
            )}
            {status === "suggested" && (
              <DropdownMenuItem>
                Reject Match
              </DropdownMenuItem>
            )}
            {(status === "unmatched" || status === "suggested") && (
              <DropdownMenuItem>
                Manual Match
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {status !== "flagged" && (
              <DropdownMenuItem>
                Flag Discrepancy
              </DropdownMenuItem>
            )}
            {status !== "excluded" && (
              <DropdownMenuItem>
                Exclude
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
