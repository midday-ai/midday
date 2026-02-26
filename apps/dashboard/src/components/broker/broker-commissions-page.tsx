"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CommissionStatusBadge, StatCard, formatCurrency } from "./shared";

export function BrokerCommissionsPage() {
  const trpc = useTRPC();

  const { data: commissions, isLoading } = useQuery(
    trpc.brokers.getMyCommissions.queryOptions(),
  );
  const { data: profile } = useQuery(trpc.brokers.getMyProfile.queryOptions());

  const totalEarned = Number(profile?.totalCommissionsEarned ?? 0);
  const totalPending = Number(profile?.pendingCommissions ?? 0);
  const totalPaid = Number(profile?.paidCommissions ?? 0);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading commissions...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-medium">My Commissions</h2>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Earned"
          value={formatCurrency(totalEarned)}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(totalPending)}
          className="text-amber-600"
        />
        <StatCard
          title="Paid"
          value={formatCurrency(totalPaid)}
          className="text-green-600"
        />
      </div>

      {!commissions || commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commissions yet.</p>
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
                <th className="text-right p-3 text-xs text-[#878787] font-normal">
                  Rate (%)
                </th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">
                  Amount
                </th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">
                  Status
                </th>
                <th className="text-left p-3 text-xs text-[#878787] font-normal">
                  Paid Date
                </th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="p-3 font-mono text-xs">{c.dealCode}</td>
                  <td className="p-3">{c.merchantName}</td>
                  <td className="p-3 text-right font-mono">
                    ${Number(c.fundingAmount).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {Number(c.commissionPercentage).toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono font-medium">
                    ${Number(c.commissionAmount).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <CommissionStatusBadge status={c.status} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {c.paidAt
                      ? new Date(c.paidAt).toLocaleDateString()
                      : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
