"use client";

import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@midday/ui/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";

export function ReconciliationStats() {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.reconciliation.getStats.queryOptions(),
  );

  if (!stats) return null;

  const matchRate =
    stats.totalTransactions > 0
      ? Math.round(
          ((stats.autoMatched + stats.manualMatched) /
            stats.totalTransactions) *
            100,
        )
      : 0;

  const estTimeSaved = Math.round(stats.autoMatched * 0.25); // ~15 seconds per auto-match

  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-muted/50 border text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00C969]" />
        <span className="text-[#606060]">Auto-matched:</span>
        <span className="font-medium tabular-nums">{stats.autoMatched}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#FFD02B]" />
        <span className="text-[#606060]">Suggested:</span>
        <span className="font-medium tabular-nums">{stats.suggested}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#FF3638]" />
        <span className="text-[#606060]">Unmatched:</span>
        <span className="font-medium tabular-nums">{stats.unmatched}</span>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <span className="text-[#606060]">Match rate:</span>
        <span className="font-medium tabular-nums">{matchRate}%</span>
      </div>

      {estTimeSaved > 0 && (
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <span className="text-[#606060]">Est. time saved:</span>
          <span className="font-medium tabular-nums text-[#00C969]">
            {estTimeSaved} min
          </span>
        </div>
      )}
    </div>
  );
}

export function ReconciliationStatsSkeleton() {
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-muted/50 border text-sm">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}
