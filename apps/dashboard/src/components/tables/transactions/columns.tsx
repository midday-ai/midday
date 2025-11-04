"use client";

import { FormatAmount } from "@/components/format-amount";
import { InlineAssignUser } from "@/components/inline-assign-user";
import { InlineSelectCategory } from "@/components/inline-select-category";
import { InlineSelectTags } from "@/components/inline-select-tags";
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
import { Spinner } from "@midday/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
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
    amount,
  }: {
    name: string;
    description?: string;
    status?: string;
    amount: number;
  }) => (
    <div className="flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(amount > 0 && "text-[#00C969]")}>
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
            side="right"
            sideOffset={10}
          >
            {description}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  ),
);

DescriptionCell.displayName = "DescriptionCell";

const AmountCell = memo(
  ({
    amount,
    currency,
  }: {
    amount: number;
    currency: string;
  }) => (
    <span className={cn("text-sm", amount > 0 && "text-[#00C969]")}>
      <FormatAmount amount={amount} currency={currency} />
    </span>
  ),
);

AmountCell.displayName = "AmountCell";

const TagsCell = memo(
  ({ tags }: { tags?: { id: string; name: string | null }[] }) => (
    <div className="relative w-full">
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
        {tags?.map(({ id, name }) => (
          <Badge
            key={id}
            variant="tag-rounded"
            className="whitespace-nowrap flex-shrink-0"
          >
            {name}
          </Badge>
        ))}
      </div>
      <div className="group-hover:hidden right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
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
    onEditTransaction,
  }: {
    transaction: Transaction;
    onViewDetails?: (id: string) => void;
    onCopyUrl?: (id: string) => void;
    onUpdateTransaction?: (data: {
      id: string;
      status?: string;
      categorySlug?: string | null;
      assignedId?: string | null;
    }) => void;
    onDeleteTransaction?: (id: string) => void;
    onEditTransaction?: (id: string) => void;
  }) => {
    const handleViewDetails = useCallback(() => {
      if (transaction.manual) {
        onEditTransaction?.(transaction.id);
      } else {
        onViewDetails?.(transaction.id);
      }
    }, [transaction.id, transaction.manual, onViewDetails, onEditTransaction]);

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
    meta: {
      className:
        "md:sticky bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-10 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
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
    meta: {
      className:
        "md:sticky bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-10 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
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
    meta: {
      className:
        "md:sticky bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-10 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => (
      <DescriptionCell
        name={row.original.name}
        description={row.original.description ?? undefined}
        status={row.original.status ?? undefined}
        amount={row.original.amount}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: {
      className: "border-l border-border",
    },
    cell: ({ row }) => (
      <AmountCell
        amount={row.original.amount}
        currency={row.original.currency}
      />
    ),
  },
  {
    accessorKey: "taxAmount",
    header: "Tax Amount",
    cell: ({ row }) => (
      <FormatAmount
        amount={row.original.taxAmount ?? 0}
        currency={row.original.currency}
        maximumFractionDigits={2}
      />
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row, table }) => {
      // Show analyzing state when enrichment is not completed
      if (!row.original.enrichmentCompleted) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 cursor-help">
                <Spinner size={14} className="stroke-primary" />
                <span className="text-[#878787] text-sm">Analyzing</span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="px-3 py-1.5 text-xs max-w-[280px]"
              side="top"
              sideOffset={5}
            >
              Analyzing transaction details to determine the best category.
            </TooltipContent>
          </Tooltip>
        );
      }

      const meta = table.options.meta;

      return (
        <InlineSelectCategory
          selected={
            row.original.category
              ? {
                  id: row.original.category.id,
                  name: row.original.category.name,
                  color: row.original.category.color,
                  slug: row.original.category.slug ?? "",
                }
              : undefined
          }
          onChange={(category) => {
            meta?.updateTransaction?.({
              id: row.original.id,
              categorySlug: category.slug,
              categoryName: category.name,
            });
          }}
        />
      );
    },
  },
  {
    accessorKey: "counterparty",
    header: "From / To",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.counterpartyName ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    meta: {
      className: "w-[280px] min-w-[280px] max-w-[280px]",
    },
    cell: ({ row }) => (
      <InlineSelectTags
        transactionId={row.original.id}
        tags={row.original.tags}
      />
    ),
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
    cell: ({ row, table }) => {
      const meta = table.options.meta;

      return (
        <InlineAssignUser
          selectedId={row.original.assigned?.id ?? undefined}
          onSelect={(user) => {
            meta?.updateTransaction?.({
              id: row.original.id,
              assignedId: user.id,
            });
          }}
        />
      );
    },
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      const fullfilled =
        row.original.status === "completed" || row.original.isFulfilled;
      const hasPendingSuggestion = row.original.hasPendingSuggestion;

      return (
        <TransactionStatus
          fullfilled={fullfilled}
          hasPendingSuggestion={hasPendingSuggestion}
        />
      );
    },
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    meta: {
      className:
        "text-right md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta;

      return (
        <ActionsCell
          transaction={row.original}
          onViewDetails={meta?.setOpen}
          onCopyUrl={meta?.copyUrl}
          onUpdateTransaction={meta?.updateTransaction}
          onDeleteTransaction={meta?.onDeleteTransaction}
          onEditTransaction={meta?.editTransaction}
        />
      );
    },
  },
];
