"use client";

import { cn } from "@midday/ui/cn";
import { formatDate } from "@midday/utils/format";

type ExpectedPayment = {
  dealId: string;
  dealCode: string;
  merchantName: string;
  expectedAmount: number;
  paymentFrequency: string | null;
  date: string;
};

type Props = {
  payments: ExpectedPayment[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function ExpectedPaymentsPanel({
  payments,
  selectedId,
  onSelect,
}: Props) {
  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No expected payments for this period
      </div>
    );
  }

  return (
    <div className="divide-y">
      {payments.map((payment) => {
        const isSelected = selectedId === payment.dealId;

        return (
          <div
            key={`${payment.dealId}-${payment.date}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(isSelected ? null : payment.dealId)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(isSelected ? null : payment.dealId);
              }
            }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
              isSelected && "bg-primary/5 ring-1 ring-primary/20",
              !isSelected && "hover:bg-muted/50",
            )}
          >
            {/* Deal indicator */}
            <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {payment.merchantName}
                </span>
                <span className="text-sm font-mono tabular-nums">
                  ${payment.expectedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(payment.date)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Deal {payment.dealCode}
                </span>
                {payment.paymentFrequency && (
                  <span className="text-xs text-muted-foreground capitalize">
                    ({payment.paymentFrequency})
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
