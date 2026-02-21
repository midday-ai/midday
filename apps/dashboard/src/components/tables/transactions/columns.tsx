"use client";

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
import { formatDate } from "@midday/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { memo, useCallback } from "react";
import { FormatAmount } from "@/components/format-amount";
import { InlineAssignUser } from "@/components/inline-assign-user";
import { InlineSelectCategory } from "@/components/inline-select-category";
import { InlineSelectTags } from "@/components/inline-select-tags";
import { TransactionBankAccount } from "@/components/transaction-bank-account";
import { TransactionMethod } from "@/components/transaction-method";
import { TransactionStatus } from "@/components/transaction-status";

type Transaction = RouterOutputs["transactions"]["get"]["data"][number];

const SelectCell = memo(
  ({
    checked,
    onChange,
    onShiftClick,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    onShiftClick?: () => void;
  }) => (
    <div
      onClick={(e) => {
        if (e.shiftKey && onShiftClick) {
          e.preventDefault();
          e.stopPropagation();
          onShiftClick();
        }
      }}
    >
      <Checkbox checked={checked} onCheckedChange={onChange} />
    </div>
  ),
);

SelectCell.displayName = "SelectCell";

const DateCell = memo(
  ({ date, format }: { date: string; format?: string | null }) =>
    formatDate(date, format),
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
  ({ amount, currency }: { amount: number; currency: string }) => (
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
    onMoveToReview,
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
    onMoveToReview?: (id: string) => void;
  }) => {
    const handleViewDetails = useCallback(() => {
      onViewDetails?.(transaction.id);
    }, [transaction.id, onViewDetails]);

    const handleEditTransaction = useCallback(() => {
      onEditTransaction?.(transaction.id);
    }, [transaction.id, onEditTransaction]);

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

    const handleUpdateToExported = useCallback(() => {
      onUpdateTransaction?.({ id: transaction.id, status: "exported" });
    }, [transaction.id, onUpdateTransaction]);

    const handleDeleteTransaction = useCallback(() => {
      onDeleteTransaction?.(transaction.id);
    }, [transaction.id, onDeleteTransaction]);

    const handleMoveToReview = useCallback(() => {
      onMoveToReview?.(transaction.id);
    }, [transaction.id, onMoveToReview]);

    return (
      <div className="flex justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icons.MoreHoriz className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewDetails}>
              View details
            </DropdownMenuItem>
            {transaction.manual && (
              <DropdownMenuItem onClick={handleEditTransaction}>
                Edit transaction
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleCopyUrl}>
              Share URL
            </DropdownMenuItem>
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

            {!transaction.isExported && transaction.status !== "exported" && (
              <DropdownMenuItem onClick={handleUpdateToExported}>
                Mark as exported
              </DropdownMenuItem>
            )}

            {(transaction.isExported || transaction.status === "exported") && (
              <DropdownMenuItem onClick={handleMoveToReview}>
                Move to review
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
      </div>
    );
  },
);

ActionsCell.displayName = "ActionsCell";

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    size: 50,
    minSize: 50,
    maxSize: 50,
    enableResizing: false,
    meta: {
      sticky: true,
      skeleton: { type: "checkbox" },
      className:
        "w-[50px] min-w-[50px] md:sticky md:left-[var(--stick-left)] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-10",
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta;
      const rows = table.getRowModel().rows;
      const rowIndex = rows.findIndex((r) => r.id === row.id);
      const handleShiftClick = () => {
        if (
          meta?.lastClickedIndex !== null &&
          meta?.lastClickedIndex !== undefined &&
          meta?.handleShiftClickRange
        ) {
          meta.handleShiftClickRange(meta.lastClickedIndex, rowIndex);
        }
        if (meta?.setLastClickedIndex) {
          meta.setLastClickedIndex(rowIndex);
        }
      };

      return (
        <SelectCell
          checked={row.getIsSelected()}
          onChange={(value) => {
            row.toggleSelected(!!value);
            if (meta?.setLastClickedIndex) {
              meta.setLastClickedIndex(rowIndex);
            }
          }}
          onShiftClick={handleShiftClick}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: "Date",
    size: 110,
    minSize: 110,
    maxSize: 110,
    enableResizing: false,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Date",
      className:
        "w-[110px] min-w-[110px] md:sticky md:left-[var(--stick-left)] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-10",
    },
    cell: ({ row, table }) => (
      <DateCell
        date={row.original.date}
        format={table.options.meta?.dateFormat}
      />
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 320,
    minSize: 200,
    maxSize: 600,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-40" },
      headerLabel: "Description",
      className:
        "w-[320px] min-w-[200px] md:sticky md:left-[var(--stick-left)] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-10",
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
    size: 170,
    minSize: 100,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Amount",
      className: "w-[170px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <AmountCell
        amount={row.original.amount}
        currency={row.original.currency}
      />
    ),
  },
  {
    accessorKey: "baseAmount",
    header: "Base Amount",
    size: 170,
    minSize: 100,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Base Amount",
      className: "w-[170px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const { baseAmount, baseCurrency, currency } = row.original;
      if (baseAmount == null || !baseCurrency || baseCurrency === currency) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <AmountCell amount={baseAmount} currency={baseCurrency} />;
    },
  },
  {
    accessorKey: "taxAmount",
    header: "Tax Amount",
    size: 170,
    minSize: 100,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Tax Amount",
      className: "w-[170px] min-w-[100px]",
    },
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
    size: 250,
    minSize: 150,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "icon-text", width: "w-28" },
      headerLabel: "Category",
      className: "w-[250px] min-w-[150px]",
    },
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
    size: 200,
    minSize: 120,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-28" },
      headerLabel: "From / To",
      className: "w-[200px] min-w-[120px]",
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.counterpartyName ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    size: 280,
    minSize: 150,
    maxSize: 500,
    enableResizing: true,
    meta: {
      skeleton: { type: "tags" },
      headerLabel: "Tags",
      className: "w-[280px] min-w-[150px]",
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
    size: 250,
    minSize: 150,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Account",
      className: "w-[250px] min-w-[150px]",
    },
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
    size: 140,
    minSize: 100,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Method",
      className: "w-[140px] min-w-[100px]",
    },
    cell: ({ row }) => <TransactionMethod method={row.original.method} />,
  },
  {
    accessorKey: "assigned",
    header: "Assigned",
    size: 220,
    minSize: 150,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "avatar-text", width: "w-24" },
      headerLabel: "Assigned",
      className: "w-[220px] min-w-[150px]",
    },
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
    header: "Status",
    size: 160,
    minSize: 120,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge", width: "w-20" },
      headerLabel: "Status",
      className: "w-[160px] min-w-[120px]",
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta;

      // Show exporting state when transaction is being exported
      if (meta?.exportingTransactionIds?.includes(row.original.id)) {
        return (
          <div className="flex items-center space-x-2">
            <Spinner size={14} className="stroke-primary" />
            <span className="text-[#878787] text-sm">Exporting</span>
          </div>
        );
      }

      return (
        <TransactionStatus
          isFulfilled={
            row.original.status === "completed" || row.original.isFulfilled
          }
          isExported={row.original.isExported ?? false}
          hasExportError={row.original.hasExportError}
          exportErrorCode={row.original.exportErrorCode}
          exportProvider={row.original.exportProvider}
          exportedAt={row.original.exportedAt}
          hasPendingSuggestion={row.original.hasPendingSuggestion}
        />
      );
    },
  },
  {
    id: "actions",
    size: 100,
    minSize: 100,
    maxSize: 100,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "w-[100px] min-w-[100px] md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-10 justify-center !border-l !border-border",
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
          onMoveToReview={meta?.moveToReview}
        />
      );
    },
  },
];
