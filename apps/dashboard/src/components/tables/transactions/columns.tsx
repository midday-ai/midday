"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { cn } from "@midday/ui/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export type Transaction = {
  id: string;
  amount: number;
  display: string;
  status: "pending" | "fulfilled";
  currency: string;
  vat: number;
  attachment: string;
  value_date: string;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    meta: {
      className: "w-[50px]",
      Loading: () => <Checkbox />,
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
    meta: {
      className: "w-[120px]",
      Loading: () => <Skeleton className="h-3.5 w-[80px]" />,
    },
    accessorKey: "value_date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.value_date), "E, LLL d"),
  },
  {
    accessorKey: "display",
    header: "To/From",
    meta: {
      className: "w-[380px]",
      Loading: () => <Skeleton className="h-3.5 w-[182px]" />,
    },
    cell: ({ row }) => {
      return (
        <span className={cn(row.original.amount > 0 && "text-[#00E547]")}>
          {row.original.display}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: {
      className: "w-[250px]",
      Loading: () => <Skeleton className="h-3.5 w-[110px]" />,
    },
    cell: ({ row }) => {
      const amount = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: row.original.currency,
      }).format(row.original.amount);

      return (
        <span className={cn(row.original.amount > 0 && "text-[#00E547]")}>
          {amount}
        </span>
      );
    },
  },
  {
    meta: {
      className: "w-[280px]",
      Loading: () => <Skeleton className="h-3.5 w-[130px]" />,
    },
    accessorKey: "transaction_code",
    header: "Method",
  },
  {
    header: "Assigned",
    meta: {
      className: "w-[180px]",
      Loading: () => (
        <div className="flex items-center space-x-2 w-[120px]">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3.5 w-[100px]" />
        </div>
      ),
    },
    cell: ({ row }) => {
      if (!row.original?.assigned) {
        return null;
      }

      return (
        <div className="flex space-x-2 w-[120px]">
          <Avatar className="h-5 w-5">
            <AvatarImage
              src={row.original.assigned?.avatar_url}
              alt={row.original.assigned?.full_name}
            />
          </Avatar>
          <span className="truncate">
            {row.original.assigned?.full_name.split(" ").at(0)}
          </span>
        </div>
      );
    },
  },
  {
    header: "Status",
    meta: {
      Loading: () => <Skeleton className="h-3.5 w-[130px]" />,
    },
    cell: ({ row }) => {
      const fullfilled = row.original.attachment && row.original.vat;
      return fullfilled ? <Icons.Check /> : <Icons.AlertCircle />;
    },
  },
];
