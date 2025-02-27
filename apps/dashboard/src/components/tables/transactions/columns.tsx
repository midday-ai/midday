"use client";

import { AssignedUser } from "@/components/assigned-user";
import { Category } from "@/components/category";
import { FormatAmount } from "@/components/format-amount";
import { TransactionBankAccount } from "@/components/transaction-bank-account";
import { TransactionMethod } from "@/components/transaction-method";
import { TransactionStatus } from "@/components/transaction-status";
import { formatDate } from "@/utils/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Badge } from "@midday/ui/badge";
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
import { ScrollArea, ScrollBar } from "@midday/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

export type Transaction = {
  id: string;
  amount: number;
  status: "posted" | "excluded" | "included" | "pending" | "completed";
  frequency?: string;
  recurring?: boolean;
  manual?: boolean;
  date: string;
  category?: {
    slug: string;
    name: string;
    color: string;
  };
  name: string;
  description?: string;
  currency: string;
  method: string;
  attachments?: {
    id: string;
    path: string;
    name: string;
    type: string;
    size: number;
  }[];
  assigned?: {
    avatar_url: string;
    full_name: string;
  };
  bank_account?: {
    name: string;
    bank_connection: {
      logo_url: string;
    };
  };
  tags?: {
    id: string;
    name: string;
  }[];
};

export const columns: ColumnDef<Transaction>[] = [
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
    cell: ({ row, table }) => {
      return formatDate(
        row.original.date,
        table.options.meta?.dateFormat,
        !table.options.meta?.hasSorting,
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <TooltipProvider delayDuration={20}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    row.original?.category?.slug === "income" &&
                      "text-[#00C969]",
                  )}
                >
                  <div className="flex space-x-2 items-center">
                    <span className="line-clamp-1 text-ellipsis max-w-[100px] md:max-w-none">
                      {row.original.name}
                    </span>

                    {row.original.status === "pending" && (
                      <div className="flex space-x-1 items-center border rounded-md text-[10px] py-1 px-2 h-[22px] text-[#878787]">
                        <span>Pending</span>
                      </div>
                    )}
                  </div>
                </span>
              </TooltipTrigger>

              {row.original?.description && (
                <TooltipContent
                  className="px-3 py-1.5 text-xs max-w-[380px]"
                  side="left"
                  sideOffset={10}
                >
                  {row.original.description}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
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
            row.original?.category?.slug === "income" && "text-[#00C969]",
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
      return (
        <Category
          name={row.original?.category?.name}
          color={row.original?.category?.color}
        />
      );
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      return (
        <div className="relative">
          <ScrollArea className="max-w-[170px] whitespace-nowrap">
            <div className="flex items-center space-x-2">
              {row.original.tags?.map((tag) => (
                <Badge key={tag.id} variant="tag" className="whitespace-nowrap">
                  {tag.tag.name}
                </Badge>
              ))}
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      );
    },
  },
  {
    accessorKey: "bank_account",
    header: "Account",
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
      if (!row.original.assigned) {
        return null;
      }

      return (
        <AssignedUser
          fullName={row.original.assigned?.full_name}
          avatarUrl={row.original.assigned?.avatar_url}
        />
      );
    },
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const fullfilled =
        row.original?.status === "completed" ||
        row?.original?.attachments?.length > 0;

      return <TransactionStatus fullfilled={fullfilled} />;
    },
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Icons.MoreHoriz />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => table.options.meta?.setOpen(row.original.id)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => table.options.meta?.copyUrl(row.original.id)}
              >
                Share URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!row.original?.manual && row.original.status === "excluded" && (
                <DropdownMenuItem
                  onClick={() => {
                    table.options.meta?.updateTransaction({
                      id: row.original.id,
                      status: "posted",
                    });
                  }}
                >
                  Include
                </DropdownMenuItem>
              )}

              {row?.original?.attachments?.length === 0 &&
                row.original.status !== "completed" && (
                  <DropdownMenuItem
                    onClick={() => {
                      table.options.meta?.updateTransaction({
                        id: row.original.id,
                        status: "completed",
                      });
                    }}
                  >
                    Mark as completed
                  </DropdownMenuItem>
                )}

              {row?.original?.attachments?.length === 0 &&
                row.original.status === "completed" && (
                  <DropdownMenuItem
                    onClick={() => {
                      table.options.meta?.updateTransaction({
                        id: row.original.id,
                        status: "posted",
                      });
                    }}
                  >
                    Mark as uncompleted
                  </DropdownMenuItem>
                )}

              {!row.original?.manual && row.original.status !== "excluded" && (
                <DropdownMenuItem
                  onClick={() => {
                    table.options.meta?.updateTransaction({
                      id: row.original.id,
                      status: "excluded",
                    });
                  }}
                >
                  Exclude
                </DropdownMenuItem>
              )}

              {row.original?.manual && (
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                transaction.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  table.options.meta?.deleteTransactions({
                    ids: [row.original.id],
                  });
                }}
              >
                {table.options.meta?.deleteTransactions?.status ===
                "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
