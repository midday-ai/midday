"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  CommissionStatusLabel,
  DealStatusBadge,
  formatCurrency,
} from "./shared";

export function BrokerDealsPage() {
  const trpc = useTRPC();
  const { data: deals, isLoading } = useQuery(
    trpc.brokers.getMyDeals.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading deals...</div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-medium">My Deals</h2>

      {!deals || deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deals found.</p>
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
                  Payback
                </th>
                <th className="text-right p-3 text-xs text-[#878787] font-normal">
                  Balance
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
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="p-3 font-mono text-xs">{deal.dealCode}</td>
                  <td className="p-3">{deal.merchantName}</td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(deal.fundingAmount)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(deal.paybackAmount)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(deal.currentBalance)}
                  </td>
                  <td className="p-3">
                    <DealStatusBadge status={deal.status} />
                  </td>
                  <td className="p-3 text-right font-mono">
                    {deal.commissionAmount
                      ? formatCurrency(deal.commissionAmount)
                      : "\u2014"}
                    {deal.commissionStatus && (
                      <CommissionStatusLabel status={deal.commissionStatus} />
                    )}
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
