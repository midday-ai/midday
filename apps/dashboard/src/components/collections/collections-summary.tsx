"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";

function StatCard({
  label,
  children,
  highlight = false,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="bg-background border border-border px-4 py-3">
      <div className="text-[12px] text-[#606060] mb-2">{label}</div>
      <div
        className={cn(
          "text-[18px] font-medium font-mono",
          highlight && "text-[#dc2626]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function CollectionsSummary() {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.collections.getStats.queryOptions(),
  );

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6">
      <StatCard label="Active Cases">
        <div className="flex items-center gap-2">
          <Icons.Collections size={16} className="text-[#606060]" />
          {stats.activeCases}
        </div>
      </StatCard>

      <StatCard label="Total Outstanding">
        <FormatAmount amount={Number(stats.totalOutstanding)} currency="USD" />
      </StatCard>

      <StatCard label="Upcoming Follow-ups">
        {stats.upcomingFollowUps}
      </StatCard>

      <StatCard label="Recovery Rate">
        <div className="flex items-center gap-2">
          {Number(stats.recoveryRate)}%
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden max-w-[80px]">
            <div
              className="h-full bg-[#16a34a] rounded-full transition-all"
              style={{ width: `${Math.min(Number(stats.recoveryRate), 100)}%` }}
            />
          </div>
        </div>
      </StatCard>

      <StatCard label="Unassigned Cases" highlight={stats.unassigned > 0}>
        {stats.unassigned}
      </StatCard>
    </div>
  );
}

export function CollectionsSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-background border border-border px-4 py-3">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
