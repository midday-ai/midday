"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<Payment>[] = [
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
