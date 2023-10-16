"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Transaction = {
  id: string;
  amount: number;
  status: "pending" | "fulfilled";
  currency: string;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "value_date",
    header: "Date",
  },
  {
    accessorKey: "display",
    header: "To/From",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: row.original.currency,
      }).format(row.original.amount),
  },
  {
    accessorKey: "transaction_code",
    header: "Method",
  },
  {
    // accessorKey: "transaction_code",
    header: "Assigned",
  },
  {
    // accessorKey: "transaction_code",
    header: "Status",
  },
];
