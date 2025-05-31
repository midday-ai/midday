"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { formatDate, getDueDateStatus } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
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
    accessorKey: "invoiceNumber",
    cell: ({ row }) => row.getValue("invoiceNumber"),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <InvoiceStatus status={row.getValue("status")} />,
  },
  {
    header: "Due date",
    accessorKey: "dueDate",
    cell: ({ row, table }) => {
      const date = row.original.dueDate;

      const showDate =
        row.original.status === "unpaid" || row.original.status === "overdue";

      return (
        <div className="flex flex-col space-y-1 w-[80px]">
          <span>
            {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
          </span>
          {showDate && (
            <span className="text-xs text-muted-foreground">
              {date ? getDueDateStatus(date as string) : "-"}
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
      const name = customer?.name || row.original.customerName;
      const viewAt = row.original.viewedAt;

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
                  {viewAt
                    ? `Viewed ${formatDistanceToNow(new Date(viewAt))} ago`
                    : ""}
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
    cell: ({ row }) => {
      if (!row.original.amount) return "-";
      return (
        <span
          className={cn("flex items-center gap-2", {
            "line-through": row.original.status === "canceled",
          })}
        >
          <FormatAmount
            amount={row.original.amount}
            currency={row.original.currency ?? "USD"}
          />
        </span>
      );
    },
  },
  {
    header: "VAT Rate",
    accessorKey: "vatRate",
    cell: ({ row }) => {
      // @ts-expect-error template is a jsonb field
      const vatRate = row.original.template.vatRate as number | undefined;
      return vatRate !== undefined && vatRate !== null ? `${vatRate}%` : "-";
    },
  },
  {
    header: "VAT Amount",
    accessorKey: "vatAmount",
    cell: ({ row }) => (
      <FormatAmount
        amount={(row.original?.vat as number) ?? null}
        currency={row.original.currency ?? "USD"}
      />
    ),
  },
  {
    header: "Tax Rate",
    accessorKey: "taxRate",
    cell: ({ row }) => {
      // @ts-expect-error template is a jsonb field
      const taxRate = row.original.template.taxRate as number | undefined;
      return taxRate !== undefined && taxRate !== null ? `${taxRate}%` : "-";
    },
  },
  {
    header: "Tax Amount",
    accessorKey: "taxAmount",
    cell: ({ row }) => (
      <FormatAmount
        amount={(row.original.tax as number) ?? null}
        currency={row.original.currency ?? "USD"}
      />
    ),
  },
  {
    header: "Excl. VAT",
    accessorKey: "exclVat",
    cell: ({ row }) => (
      <FormatAmount
        amount={(row.original.amount as number) - (row.original.vat as number)}
        currency={row.original.currency ?? "USD"}
      />
    ),
  },
  {
    header: "Excl. Tax",
    accessorKey: "exclTax",
    cell: ({ row }) => (
      <FormatAmount
        amount={(row.original.amount as number) - (row.original.tax as number)}
        currency={row.original.currency ?? "USD"}
      />
    ),
  },
  {
    header: "Internal Note",
    accessorKey: "internalNote",
    cell: ({ row }) => {
      return <span className="truncate">{row.original.internalNote}</span>;
    },
  },
  {
    header: "Issue date",
    accessorKey: "issueDate",
    cell: ({ row, table }) => {
      const date = row.original.issueDate;
      return (
        <span>
          {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    header: "Sent at",
    accessorKey: "sentAt",
    cell: ({ row, table }) => {
      const sentAt = row.original.sentAt;
      const sentTo = row.original.sentTo;

      if (!sentAt) {
        return "-";
      }

      if (!sentTo) {
        return formatDate(sentAt, table.options.meta?.dateFormat);
      }

      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="flex items-center space-x-2">
              {formatDate(sentAt, table.options.meta?.dateFormat)}
            </TooltipTrigger>
            <TooltipContent
              className="text-xs py-1 px-2"
              side="right"
              sideOffset={5}
            >
              {sentTo}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
