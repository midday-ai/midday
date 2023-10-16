"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Checkbox } from "@midday/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

export type Transaction = {
  id: string;
  amount: number;
  status: "pending" | "fulfilled";
  currency: string;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    meta: {
      className:
        "sticky left-0 bg-background w-[50px] min-w-[50px] max-w[50px]",
    },
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableHiding: false,
  },
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
    header: "Assigned",
    cell: ({ row }) => {
      if (!row.original?.assigned) {
        return null;
      }

      return (
        <div className="flex space-x-2">
          <Avatar className="h-5 w-5">
            <AvatarImage
              src={row.original.assigned?.avatar_url}
              alt={row.original.assigned?.full_name}
            />
          </Avatar>
          <span>{row.original.assigned?.full_name}</span>
        </div>
      );
    },
  },
  {
    header: "Status",
  },
];
