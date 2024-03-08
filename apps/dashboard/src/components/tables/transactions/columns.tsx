"use client";

import { AssignedUser } from "@/components/assigned-user";
import { Category } from "@/components/category";
import { FormatAmount } from "@/components/format-amount";
import { TransactionBankAccount } from "@/components/transaction-bank-account";
import { TransactionMethod } from "@/components/transaction-method";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { cn } from "@midday/ui/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format, isSameYear } from "date-fns";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      if (isSameYear(new Date(), new Date(row.original.date))) {
        return format(new Date(row.original.date), "MMM d");
      }

      return format(new Date(row.original.date), "P");
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  row.original.category === "income" && "text-[#00C969]"
                )}
              >
                <div className="flex space-x-2 items-center">
                  <span>{row.original.name}</span>
                  {row.original.status === "pending" && (
                    <div className="flex space-x-1 items-center border rounded-md text-xs py-1 px-2 h-[22px] text-[#878787]">
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              </span>
            </TooltipTrigger>
            {row.original?.description && (
              <TooltipContent
                className="px-3 py-1.5 text-xs"
                side="left"
                sideOffset={10}
              >
                {row.original.description}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      return (
        <span
          className={cn(
            "text-sm",
            row.original.category === "income" && "text-[#00C969]"
          )}
        >
          <FormatAmount
            amount={row.original.amount}
            currency={row.original.currency}
          />
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      return <Category name={row.original.category} />;
    },
  },
  {
    accessorKey: "bank_account",
    header: "Bank Account",
    cell: ({ row }) => {
      return (
        <TransactionBankAccount
          name={row.original?.bank_account?.name}
          logoUrl={row.original?.bank_account?.bank_connection?.logo_url}
        />
      );
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      return <TransactionMethod method={row.original.method} />;
    },
  },
  {
    accessorKey: "assigned",
    header: "Assigned",
    cell: ({ row }) => {
      return <AssignedUser user={row.original.assigned} />;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const fullfilled = row?.original?.attachments?.length > 0;

      if (fullfilled) {
        return <Icons.Check />;
      }

      return (
        <TooltipProvider delayDuration={50}>
          <Tooltip>
            <TooltipTrigger>
              <Icons.AlertCircle />
            </TooltipTrigger>
            <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={5}>
              Missing attachment
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
];
