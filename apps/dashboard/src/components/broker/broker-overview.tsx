"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DealStatusBadge, StatCard, formatCurrency } from "./shared";

export function BrokerOverview() {
  const trpc = useTRPC();

  const { data: profile, isLoading: profileLoading } = useQuery(
    trpc.brokers.getMyProfile.queryOptions(),
  );
  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.brokers.getMyDealStats.queryOptions(),
  );
  const { data: deals, isLoading: dealsLoading } = useQuery(
    trpc.brokers.getMyDeals.queryOptions(),
  );

  const isLoading = profileLoading || statsLoading || dealsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border border-border p-4 animate-pulse"
            >
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-7 w-16 bg-muted rounded mt-2" />
            </div>
          ))}
        </div>
        <div>
          <div className="h-4 w-24 bg-muted rounded mb-3" />
          <div className="border border-border p-8 animate-pulse">
            <div className="h-4 w-48 bg-muted rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const totalCommissions = profile?.totalCommissionsEarned ?? 0;
  const pendingCommissions = profile?.pendingCommissions ?? 0;
  const paidCommissions = profile?.paidCommissions ?? 0;

  const recentDeals = (deals ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Deals" value={stats?.totalDeals ?? 0} />
        <StatCard title="Active Deals" value={stats?.activeDeals ?? 0} />
        <StatCard
          title="Total Funded"
          value={formatCurrency(stats?.totalFunded)}
        />
        <StatCard
          title="Commissions"
          value={formatCurrency(totalCommissions)}
          subtitle={`${formatCurrency(pendingCommissions)} pending \u00b7 ${formatCurrency(paidCommissions)} paid`}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Recent Deals</h3>
        {recentDeals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deals yet.</p>
        ) : (
          <div className="border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-xs text-[#878787] font-normal">
                    Deal Code
                  </th>
                  <th className="text-left p-3 text-xs text-[#878787] font-normal">
                    Merchant
                  </th>
                  <th className="text-right p-3 text-xs text-[#878787] font-normal">
                    Funded
                  </th>
                  <th className="text-left p-3 text-xs text-[#878787] font-normal">
                    Status
                  </th>
                  <th className="text-right p-3 text-xs text-[#878787] font-normal">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-3 font-mono text-xs">{deal.dealCode}</td>
                    <td className="p-3">{deal.merchantName}</td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(deal.fundingAmount)}
                    </td>
                    <td className="p-3">
                      <DealStatusBadge status={deal.status} />
                    </td>
                    <td className="p-3 text-right font-mono">
                      {deal.commissionAmount
                        ? formatCurrency(deal.commissionAmount)
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
