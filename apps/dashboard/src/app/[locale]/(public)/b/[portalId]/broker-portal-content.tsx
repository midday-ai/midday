"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";

type Props = {
  portalId: string;
};

export function BrokerPortalContent({ portalId }: Props) {
  const trpc = useTRPC();

  const { data: broker } = useQuery(
    trpc.brokers.getByPortalId.queryOptions({ portalId }),
  );

  const { data: deals } = useQuery(
    trpc.brokers.getPortalDeals.queryOptions({ portalId }),
  );

  if (!broker) {
    return null;
  }

  const activeDeals = deals?.filter((d) => d.status === "active") ?? [];
  const totalFunded = deals?.reduce(
    (sum, d) => sum + Number(d.fundingAmount),
    0,
  ) ?? 0;
  const totalCommissions = deals?.reduce(
    (sum, d) => sum + Number(d.commissionAmount ?? 0),
    0,
  ) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            {broker.team?.logoUrl && (
              <img
                src={broker.team.logoUrl}
                alt={broker.team.name ?? undefined}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-lg font-medium">
                {broker.team?.name || "Broker Portal"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Portal for {broker.name}
                {broker.companyName ? ` \u2014 ${broker.companyName}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Deals</p>
            <p className="text-2xl font-mono font-medium">
              {deals?.length ?? 0}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Deals</p>
            <p className="text-2xl font-mono font-medium">
              {activeDeals.length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Funded</p>
            <p className="text-2xl font-mono font-medium">
              ${totalFunded.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Deals Table */}
        <div>
          <h2 className="text-sm font-medium mb-3">Your Deals</h2>
          {deals && deals.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Deal Code
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Merchant
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Funded
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Balance
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border"
                  >
                    <td className="py-3 px-4 text-sm font-mono">
                      {deal.dealCode}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {deal.merchantName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          deal.status === "active"
                            ? "bg-green-50 text-green-700"
                            : deal.status === "paid_off"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {deal.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      ${Number(deal.fundingAmount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      ${Number(deal.currentBalance).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      {deal.commissionAmount
                        ? `$${Number(deal.commissionAmount).toLocaleString()}`
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No deals yet.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-16">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Powered by Abacus
          </p>
        </div>
      </div>
    </div>
  );
}
