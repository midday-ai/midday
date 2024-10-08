"use client";

import { FormatAmount } from "@/components/format-amount";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

export type Invoice = {
  id: string;
  due_date: string;
  status: string;
  currency: string;
  amount: number;
  customer?: {
    name: string;
  };
};

export const columns: ColumnDef<Invoice>[] = [
  {
    header: "Due date",
    accessorKey: "due_date",
    cell: ({ row }) => row.getValue("due_date"),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => row.getValue("status"),
  },
  {
    header: "Customer",
    accessorKey: "customer",
    cell: ({ row }) => row.original.customer?.name,
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => (
      <FormatAmount
        amount={row.getValue("amount")}
        currency={row.getValue("currency")}
      />
    ),
  },
  {
    header: "Invoice no.",
    accessorKey: "invoice_no",
    cell: ({ row }) => row.getValue("invoice_no"),
  },
  {
    header: "Recurring",
    accessorKey: "recurring",
    cell: ({ row }) => row.getValue("recurring"),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const [isOpen, setOpen] = React.useState(false);

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
