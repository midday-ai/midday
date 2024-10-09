"use client";

import { deleteInvoiceAction } from "@/actions/invoice/delete-invoice-action";
import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { formatDate, getDueDateStatus } from "@/utils/format";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import * as React from "react";

export type Invoice = {
  id: string;
  due_date: string;
  status: string;
  currency: string;
  invoice_number: string;
  amount: number;
  customer?: {
    id: string;
    name: string;
    website: string;
  };
};

export const columns: ColumnDef<Invoice>[] = [
  {
    header: "Due date",
    accessorKey: "due_date",
    cell: ({ row }) => {
      const date = row.getValue("due_date");
      return (
        <div className="flex flex-col space-y-1">
          <span>{date ? formatDate(date) : "-"}</span>
          <span className="text-xs text-muted-foreground">
            {date ? getDueDateStatus(date) : "-"}
          </span>
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <InvoiceStatus status={row.getValue("status")} />,
  },
  {
    header: "Customer",
    accessorKey: "customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="size-5">
            <AvatarImage
              src={`https://img.logo.dev/${customer?.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=60`}
              alt={`${customer?.name} logo`}
            />
            <AvatarFallback className="text-[9px] font-medium">
              {customer?.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{customer?.name}</span>
        </div>
      );
    },
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => (
      <FormatAmount
        amount={row.getValue("amount")}
        currency={row.original.currency}
      />
    ),
  },
  {
    header: "Invoice no.",
    accessorKey: "invoice_number",
    cell: ({ row }) => row.getValue("invoice_number"),
  },
  {
    header: "Invoice date",
    accessorKey: "invoice_date",
    cell: ({ row }) => {
      const date = row.getValue("invoice_date");
      return <span>{date ? formatDate(date) : "-"}</span>;
    },
  },
  {
    header: "Recurring",
    accessorKey: "recurring",
    cell: ({ row }) => row.getValue("recurring") ?? "One time",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const deleteInvoice = useAction(deleteInvoiceAction);
      const { setParams } = useInvoiceParams();

      return (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setParams({
                    invoiceId: row.original.id,
                  })
                }
              >
                View details
              </DropdownMenuItem>

              {status !== "draft" && (
                <>
                  <DropdownMenuItem>Download</DropdownMenuItem>
                  <DropdownMenuItem>Copy link</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                </>
              )}

              {(status === "draft" ||
                status === "overdue" ||
                status === "unpaid") && (
                <DropdownMenuItem
                  onClick={() => deleteInvoice.execute({ id: row.original.id })}
                  className="text-[#FF3638]"
                >
                  Cancel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
