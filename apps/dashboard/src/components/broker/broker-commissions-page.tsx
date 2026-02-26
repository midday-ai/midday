"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";

type CommissionStatProps = {
  title: string;
  value: string;
  className?: string;
};

function CommissionStat({ title, value, className }: CommissionStatProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-xs text-[#878787] font-normal">{title}</p>
      <p className={cn("text-xl font-mono font-semibold mt-1", className)}>
        {value}
      </p>
    </div>
  );
}

function CommissionStatusBadge({ status }: { status: string }) {
  function getStatusStyles(s: string): string {
    switch (s) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusStyles(status))}>
      {status}
    </span>
  );
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

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
        <CommissionStat
          title="Total Earned"
          value={formatCurrency(totalEarned)}
        />
        <CommissionStat
          title="Pending"
          value={formatCurrency(totalPending)}
          className="text-amber-600"
        />
        <CommissionStat
          title="Paid"
          value={formatCurrency(totalPaid)}
          className="text-green-600"
        />
      </div>

      {!commissions || commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commissions yet.</p>
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
