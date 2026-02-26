"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-xs text-[#878787] font-normal">{title}</p>
      <p className="text-2xl font-mono font-semibold mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function DealStatusBadge({ status }: { status: string }) {
  function getStatusStyles(s: string): string {
    switch (s) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      case "paid_off":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
      case "defaulted":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusStyles(status))}>
      {status.replace("_", " ")}
    </span>
  );
}

function formatCurrency(value: string | number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export function BrokerOverview() {
  const trpc = useTRPC();

  const { data: profile } = useQuery(trpc.brokers.getMyProfile.queryOptions());
  const { data: stats } = useQuery(
    trpc.brokers.getMyDealStats.queryOptions(),
  );
  const { data: deals } = useQuery(trpc.brokers.getMyDeals.queryOptions());

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
          <div className="border border-border rounded-lg overflow-hidden">
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
