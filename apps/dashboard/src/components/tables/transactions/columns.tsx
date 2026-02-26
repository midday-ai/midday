"use client";

import { FormatAmount } from "@/components/format-amount";
import { InlineSelectTags } from "@/components/inline-select-tags";
import { TransactionTypeBadge } from "@/components/transaction-type-badge";
import { TransactionBankAccount } from "@/components/transaction-bank-account";
import { TransactionMethod } from "@/components/transaction-method";
import { TransactionSource } from "@/components/transaction-source";
import { TransactionStatus } from "@/components/transaction-status";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { formatDate } from "@midday/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { memo, useCallback } from "react";

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
  ({
    date,
    format,
  }: { date: string; format?: string | null }) => formatDate(date, format),
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

const DealCell = memo(
  ({ dealCode }: { dealCode: string | null }) => {
    if (!dealCode) {
      return (
        <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Unassigned
        </span>
      );
    }

    return (
      <span className="text-sm font-mono text-foreground">
        {dealCode}
      </span>
    );
  },
);

DealCell.displayName = "DealCell";

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

const DISCREPANCY_TYPES = [
  { value: "partial_payment", label: "Partial payment" },
  { value: "overpayment", label: "Overpayment" },
  { value: "duplicate", label: "Duplicate" },
  { value: "unrecognized", label: "Unrecognized" },
  { value: "bank_fee", label: "Bank fee" },
  { value: "split_payment", label: "Split payment" },
] as const;

const ActionsCell = memo(
  ({
    transaction,
    onViewDetails,
    onCopyUrl,
    onDeleteTransaction,
    onEditTransaction,
    // MCA matching actions
    onMatchToDeal,
    onConfirmMatch,
    onRejectMatch,
    onUnmatch,
    // MCA flagging actions
    onMarkNsf,
    onClearNsf,
    onFlagForReview,
    onResolveFlag,
    // MCA workflow actions
    onRecordCollection,
    onCreateDeal,
    onEscalateToCollections,
    onExclude,
  }: {
    transaction: Transaction;
    onViewDetails?: (id: string) => void;
    onCopyUrl?: (id: string) => void;
    onDeleteTransaction?: (id: string) => void;
    onEditTransaction?: (id: string) => void;
    onMatchToDeal?: (transaction: Transaction) => void;
    onConfirmMatch?: (id: string) => void;
    onRejectMatch?: (id: string) => void;
    onUnmatch?: (id: string) => void;
    onMarkNsf?: (transaction: Transaction) => void;
    onClearNsf?: (id: string) => void;
    onFlagForReview?: (transaction: Transaction, discrepancyType: string) => void;
    onResolveFlag?: (transaction: Transaction) => void;
    onRecordCollection?: (transaction: Transaction) => void;
    onCreateDeal?: (transaction: Transaction) => void;
    onEscalateToCollections?: (transaction: Transaction) => void;
    onExclude?: (id: string) => void;
  }) => {
    const matchStatus = transaction.matchStatus;
    const isUnmatched = !matchStatus || matchStatus === "unmatched";
    const isSuggested = matchStatus === "suggested" || matchStatus === "auto_matched";
    const isMatched = matchStatus === "manual_matched" || matchStatus === "auto_matched";
    const isFlagged = matchStatus === "flagged";
    const isExcluded = matchStatus === "excluded";
    const isNsf = transaction.discrepancyType === "nsf";
    const hasDeal = !!transaction.matchedDealId;
    const isLikelyFunding = !hasDeal && transaction.amount > 0;

    return (
      <div className="flex justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icons.MoreHoriz className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Core actions */}
            <DropdownMenuItem onClick={() => onViewDetails?.(transaction.id)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails?.(transaction.id)}>
              <Icons.AI size={14} className="mr-2" />
              Explain with AI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopyUrl?.(transaction.id)}>
              Share URL
            </DropdownMenuItem>

            {/* Matching section */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
              Matching
            </DropdownMenuLabel>

            {isUnmatched && (
              <DropdownMenuItem onClick={() => onMatchToDeal?.(transaction)}>
                Match to deal
              </DropdownMenuItem>
            )}

            {isSuggested && (
              <>
                <DropdownMenuItem onClick={() => onConfirmMatch?.(transaction.id)}>
                  Confirm match
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRejectMatch?.(transaction.id)}>
                  Reject match
                </DropdownMenuItem>
              </>
            )}

            {isMatched && !isSuggested && (
              <DropdownMenuItem onClick={() => onUnmatch?.(transaction.id)}>
                Unmatch
              </DropdownMenuItem>
            )}

            {/* Flagging section */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
              Flagging
            </DropdownMenuLabel>

            {!isNsf && !isExcluded && (
              <DropdownMenuItem onClick={() => onMarkNsf?.(transaction)}>
                Mark as NSF
              </DropdownMenuItem>
            )}

            {isNsf && (
              <DropdownMenuItem onClick={() => onClearNsf?.(transaction.id)}>
                Clear NSF flag
              </DropdownMenuItem>
            )}

            {!isFlagged && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Flag for review</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {DISCREPANCY_TYPES.map((type) => (
                    <DropdownMenuItem
                      key={type.value}
                      onClick={() => onFlagForReview?.(transaction, type.value)}
                    >
                      {type.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            {isFlagged && (
              <DropdownMenuItem onClick={() => onResolveFlag?.(transaction)}>
                Resolve flag
              </DropdownMenuItem>
            )}

            {/* Workflow section */}
            {(hasDeal || isLikelyFunding) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                  Workflow
                </DropdownMenuLabel>

                {hasDeal && (
                  <DropdownMenuItem onClick={() => onRecordCollection?.(transaction)}>
                    Record collection
                  </DropdownMenuItem>
                )}

                {isLikelyFunding && (
                  <DropdownMenuItem onClick={() => onCreateDeal?.(transaction)}>
                    Create deal
                  </DropdownMenuItem>
                )}

                {hasDeal && (
                  <DropdownMenuItem onClick={() => onEscalateToCollections?.(transaction)}>
                    Escalate to collections
                  </DropdownMenuItem>
                )}
              </>
            )}

            {/* Danger zone */}
            {(transaction.manual || !isExcluded) && (
              <>
                <DropdownMenuSeparator />

                {transaction.manual && (
                  <DropdownMenuItem onClick={() => onEditTransaction?.(transaction.id)}>
                    Edit transaction
                  </DropdownMenuItem>
                )}

                {!isExcluded && (
                  <DropdownMenuItem onClick={() => onExclude?.(transaction.id)}>
                    Exclude from reconciliation
                  </DropdownMenuItem>
                )}

                {transaction.manual && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteTransaction?.(transaction.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </>
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
    accessorKey: "transactionType",
    header: "Type",
    size: 140,
    minSize: 100,
    maxSize: 250,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge", width: "w-16" },
      headerLabel: "Type",
      className: "w-[140px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <TransactionTypeBadge type={row.original.transactionType} />
    ),
  },
  {
    accessorKey: "dealCode",
    header: "Deal",
    size: 160,
    minSize: 120,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Deal",
      className: "w-[160px] min-w-[120px]",
    },
    cell: ({ row }) => <DealCell dealCode={row.original.dealCode ?? null} />,
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
    accessorKey: "source",
    header: "Source",
    size: 140,
    minSize: 100,
    maxSize: 250,
    enableResizing: true,
    enableSorting: false,
    meta: {
      skeleton: { type: "badge", width: "w-16" },
      headerLabel: "Source",
      className: "w-[140px] min-w-[100px]",
    },
    cell: ({ row }) => (
      <TransactionSource
        manual={row.original.manual ?? false}
        hasAccount={Boolean(row.original.account)}
        accountName={row.original.account?.name ?? undefined}
      />
    ),
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
          onDeleteTransaction={meta?.onDeleteTransaction}
          onEditTransaction={meta?.editTransaction}
          // MCA matching actions
          onMatchToDeal={meta?.onMatchToDeal}
          onConfirmMatch={meta?.onConfirmMatch}
          onRejectMatch={meta?.onRejectMatch}
          onUnmatch={meta?.onUnmatch}
          // MCA flagging actions
          onMarkNsf={meta?.onMarkNsf}
          onClearNsf={meta?.onClearNsf}
          onFlagForReview={meta?.onFlagForReview}
          onResolveFlag={meta?.onResolveFlag}
          // MCA workflow actions
          onRecordCollection={meta?.onRecordCollection}
          onCreateDeal={meta?.onCreateDeal}
          onEscalateToCollections={meta?.onEscalateToCollections}
          onExclude={meta?.onExclude}
        />
      );
    },
  },
];
