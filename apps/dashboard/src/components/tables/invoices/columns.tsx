"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { formatDate, getDueDateStatus } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { TooltipProvider } from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import { ActionsMenu } from "./actions-menu";

export type Invoice = NonNullable<
  RouterOutputs["invoice"]["get"]["data"]
>[number];

export const columns: ColumnDef<Invoice>[] = [
  {
    header: "Invoice no.",
    accessorKey: "invoice_number",
    cell: ({ row }) => row.getValue("invoice_number"),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <InvoiceStatus status={row.getValue("status")} />,
  },
  {
    header: "Due date",
    accessorKey: "due_date",
    cell: ({ row, table }) => {
      const date = row.getValue("due_date");

      const showDate =
        row.original.status === "unpaid" || row.original.status === "overdue";

      return (
        <div className="flex flex-col space-y-1 w-[80px]">
          <span>
            {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
          </span>
          {showDate && (
            <span className="text-xs text-muted-foreground">
              {date ? getDueDateStatus(date) : "-"}
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: "Customer",
    accessorKey: "customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      const name = customer?.name || row.original.customer_name;
      const viewAt = row.original.viewed_at;

      if (!name) return "-";

      return (
        <div className="flex items-center space-x-2">
          <Avatar className="size-5">
            {customer?.website && (
              <AvatarImageNext
                src={getWebsiteLogo(customer?.website)}
                alt={`${name} logo`}
                width={20}
                height={20}
                quality={100}
              />
            )}
            <AvatarFallback className="text-[9px] font-medium">
              {name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{name}</span>

          {viewAt && row.original.status !== "paid" && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger className="flex items-center space-x-2">
                  <Icons.Visibility className="size-4 text-[#878787]" />
                </TooltipTrigger>
                <TooltipContent
                  className="text-xs py-1 px-2"
                  side="right"
                  sideOffset={5}
                >
                  {`Viewed ${formatDistanceToNow(viewAt)} ago`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => (
      <span
        className={cn("flex items-center gap-2", {
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={row.getValue("amount")}
          currency={row.original.currency}
        />
      </span>
    ),
  },
  {
    header: "Issue date",
    accessorKey: "issue_date",
    cell: ({ row, table }) => {
      const date = row.getValue("issue_date");
      return (
        <span>
          {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <ActionsMenu row={row.original} />;
    },
  },
];
