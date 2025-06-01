"use client";

import { AssignedUser } from "@/components/assigned-user";
import { Category } from "@/components/category";
import { FormatAmount } from "@/components/format-amount";
import { TransactionBankAccount } from "@/components/transaction-bank-account";
import { TransactionMethod } from "@/components/transaction-method";
import { TransactionStatus } from "@/components/transaction-status";
import { formatDate } from "@/utils/format";
import type { RouterOutputs } from "@api/trpc/routers/_app";
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
import { TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { memo, useCallback } from "react";

type Transaction = RouterOutputs["transactions"]["get"]["data"][number];

const SelectCell = memo(
  ({
    checked,
    onChange,
  }: { checked: boolean; onChange: (value: boolean) => void }) => (
    <Checkbox checked={checked} onCheckedChange={onChange} />
  ),
);

SelectCell.displayName = "SelectCell";

const DateCell = memo(
  ({
    date,
    format,
    noSort,
  }: { date: string; format?: string | null; noSort?: boolean }) =>
    formatDate(date, format, noSort),
);

DateCell.displayName = "DateCell";

const DescriptionCell = memo(
  ({
    name,
    description,
    status,
    categorySlug,
  }: {
    name: string;
    description?: string;
    status?: string;
    categorySlug?: string | null;
  }) => (
    <div className="flex items-center space-x-2">
      <TooltipTrigger asChild>
        <span className={cn(categorySlug === "income" && "text-[#00C969]")}>
          <div className="flex space-x-2 items-center">
            <span className="line-clamp-1 text-ellipsis max-w-[100px] md:max-w-none">
              {name}
            </span>

            {status === "pending" && (
              <div className="flex space-x-1 items-center border rounded-md text-[10px] py-1 px-2 h-[22px] text-[#878787]">
                <span>Pending</span>
              </div>
            )}
          </div>
        </span>
      </TooltipTrigger>

      {description && (
        <TooltipContent
          className="px-3 py-1.5 text-xs max-w-[380px]"
          side="left"
          sideOffset={10}
        >
          {description}
        </TooltipContent>
      )}
    </div>
  ),
);

DescriptionCell.displayName = "DescriptionCell";

const AmountCell = memo(
  ({
    amount,
    currency,
    categorySlug,
  }: {
    amount: number;
    currency: string;
    categorySlug?: string | null;
  }) => (
    <span
      className={cn("text-sm", categorySlug === "income" && "text-[#00C969]")}
    >
      <FormatAmount amount={amount} currency={currency} />
    </span>
  ),
);

AmountCell.displayName = "AmountCell";

const TagsCell = memo(
  ({ tags }: { tags?: { id: string; name: string | null }[] }) => (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {tags?.map(({ id, name }) => (
          <Badge key={id} variant="tag-rounded" className="whitespace-nowrap">
            {name}
          </Badge>
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  ),
);

TagsCell.displayName = "TagsCell";

const ActionsCell = memo(
  ({
    transaction,
    onViewDetails,
    onCopyUrl,
    onUpdateTransaction,
    onDeleteTransaction,
  }: {
    transaction: Transaction;
    onViewDetails?: (id: string) => void;
    onCopyUrl?: (id: string) => void;
    onUpdateTransaction?: (data: { id: string; status: string }) => void;
    onDeleteTransaction?: (id: string) => void;
  }) => {
    const handleViewDetails = useCallback(() => {
      onViewDetails?.(transaction.id);
    }, [transaction.id, onViewDetails]);

    const handleCopyUrl = useCallback(() => {
      onCopyUrl?.(transaction.id);
    }, [transaction.id, onCopyUrl]);

    const handleUpdateToPosted = useCallback(() => {
      onUpdateTransaction?.({ id: transaction.id, status: "posted" });
    }, [transaction.id, onUpdateTransaction]);

    const handleUpdateToCompleted = useCallback(() => {
      onUpdateTransaction?.({ id: transaction.id, status: "completed" });
    }, [transaction.id, onUpdateTransaction]);

    const handleUpdateToExcluded = useCallback(() => {
      onUpdateTransaction?.({ id: transaction.id, status: "excluded" });
    }, [transaction.id, onUpdateTransaction]);

    const handleDeleteTransaction = useCallback(() => {
      onDeleteTransaction?.(transaction.id);
    }, [transaction.id, onDeleteTransaction]);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <Icons.MoreHoriz />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewDetails}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyUrl}>Share URL</DropdownMenuItem>
          <DropdownMenuSeparator />
          {!transaction.manual && transaction.status === "excluded" && (
            <DropdownMenuItem onClick={handleUpdateToPosted}>
              Include
            </DropdownMenuItem>
          )}

          {!transaction.isFulfilled && (
            <DropdownMenuItem onClick={handleUpdateToCompleted}>
              Mark as completed
            </DropdownMenuItem>
          )}

          {transaction.isFulfilled && transaction.status === "completed" && (
            <DropdownMenuItem onClick={handleUpdateToPosted}>
              Mark as uncompleted
            </DropdownMenuItem>
          )}

          {!transaction.manual && transaction.status !== "excluded" && (
            <DropdownMenuItem onClick={handleUpdateToExcluded}>
              Exclude
            </DropdownMenuItem>
          )}

          {transaction.manual && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDeleteTransaction}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

ActionsCell.displayName = "ActionsCell";

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    cell: ({ row }) => (
      <SelectCell
        checked={row.getIsSelected()}
        onChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row, table }) => (
      <DateCell
        date={row.original.date}
        format={table.options.meta?.dateFormat}
        noSort={!table.options.meta?.hasSorting}
      />
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <DescriptionCell
        name={row.original.name}
        description={row.original.description ?? undefined}
        status={row.original.status ?? undefined}
        categorySlug={row.original?.category?.slug}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <AmountCell
        amount={row.original.amount}
        currency={row.original.currency}
        categorySlug={row.original?.category?.slug}
      />
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Category
        name={row.original?.category?.name ?? ""}
        color={row.original?.category?.color ?? ""}
      />
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
  {
    accessorKey: "bank_account",
    header: "Account",
    cell: ({ row }) => (
      <TransactionBankAccount
        name={row.original?.account?.name ?? undefined}
        logoUrl={row.original?.account?.connection?.logoUrl ?? undefined}
      />
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => <TransactionMethod method={row.original.method} />,
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
          fullName={row.original.assigned?.fullName}
          avatarUrl={row.original.assigned?.avatarUrl}
        />
      );
    },
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const fullfilled =
        row.original.status === "completed" || row.original.isFulfilled;

      return <TransactionStatus fullfilled={fullfilled} />;
    },
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta;

      return (
        <ActionsCell
          transaction={row.original}
          onViewDetails={meta?.setOpen}
          onCopyUrl={meta?.copyUrl}
          onUpdateTransaction={meta?.updateTransaction}
          onDeleteTransaction={meta?.onDeleteTransaction}
        />
      );
    },
  },
];
