"use client";

import { cn } from "@midday/ui/cn";

type Props = {
  transactionCount: number;
  totalBank: number;
  totalExpected: number;
  variance: number;
};

export function SessionHeader({
  transactionCount,
  totalBank,
  totalExpected,
  variance,
}: Props) {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="flex items-center justify-between px-4 py-3 mb-4 bg-muted/50 rounded-lg border text-sm">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-muted-foreground">Transactions: </span>
          <span className="font-medium tabular-nums">{transactionCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Bank Total: </span>
          <span className="font-medium tabular-nums">{fmt(totalBank)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Expected Total: </span>
          <span className="font-medium tabular-nums">{fmt(totalExpected)}</span>
        </div>
      </div>
      <div
        className={cn(
          "font-medium tabular-nums",
          variance === 0 && "text-emerald-600",
          variance > 0 && "text-amber-600",
          variance < 0 && "text-red-600",
        )}
      >
        Variance: {fmt(variance)}
      </div>
    </div>
  );
}
