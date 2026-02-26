"use client";

import { MatchConfidenceBar } from "@/components/match-confidence-bar";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { FormatAmount } from "@/components/format-amount";
import { cn } from "@midday/ui/cn";
import { formatDate } from "@midday/utils/format";

type Transaction = {
  id: string;
  date: string;
  name: string;
  amount: number;
  currency: string;
  matchStatus: string | null;
  matchConfidence: number | null;
  matchedDealCode: string | null;
  matchRule: string | null;
  counterpartyName: string | null;
};

type Props = {
  transactions: Transaction[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onConfirmSuggested: (id: string) => void;
};

export function TransactionPanel({
  transactions,
  selectedId,
  onSelect,
  onConfirmSuggested,
}: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No transactions for this period
      </div>
    );
  }

  return (
    <div className="divide-y">
      {transactions.map((tx) => {
        const isSelected = selectedId === tx.id;
        const isMatched =
          tx.matchStatus === "auto_matched" ||
          tx.matchStatus === "manual_matched";
        const isSuggested = tx.matchStatus === "suggested";

        return (
          <div
            key={tx.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(isSelected ? null : tx.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(isSelected ? null : tx.id);
              }
            }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
              isSelected && "bg-primary/5 ring-1 ring-primary/20",
              isMatched && "opacity-60",
              !isMatched && !isSelected && "hover:bg-muted/50",
            )}
          >
            {/* Status indicator */}
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                tx.matchStatus === "auto_matched" && "bg-[#00C969]",
                tx.matchStatus === "manual_matched" && "bg-[#1F6FEB]",
                tx.matchStatus === "suggested" && "bg-[#FFD02B]",
                tx.matchStatus === "flagged" && "bg-[#FF3638]",
                tx.matchStatus === "unmatched" && "bg-[#878787]",
                tx.matchStatus === "excluded" && "bg-[#878787]/50",
              )}
            />

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {tx.name}
                </span>
                <FormatAmount amount={tx.amount} currency={tx.currency} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(tx.date)}
                </span>
                {tx.counterpartyName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {tx.counterpartyName}
                  </span>
                )}
              </div>
            </div>

            {/* Match info */}
            <div className="flex items-center gap-2 shrink-0">
              <MatchStatusBadge status={tx.matchStatus} />
              {isSuggested && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmSuggested(tx.id);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
