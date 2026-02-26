"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useQuery } from "@tanstack/react-query";

type Props = {
  portalId: string;
};

export function SyndicatorPortalContent({ portalId }: Props) {
  const trpc = useTRPC();

  const { data: syndicator } = useQuery(
    trpc.syndication.getByPortalId.queryOptions({ portalId }),
  );

  const { data: deals } = useQuery(
    trpc.syndication.getPortalDeals.queryOptions({ portalId }),
  );

  const { data: portalBalance } = useQuery(
    trpc.syndication.getPortalBalance.queryOptions({ portalId }),
  );

  const { data: portalTxResult } = useQuery(
    trpc.syndication.getPortalTransactions.queryOptions({ portalId }),
  );

  if (!syndicator) {
    return null;
  }

  const activeDeals =
    deals?.filter((d) => d.status === "active") ?? [];
  const totalInvested =
    deals?.reduce((sum, d) => sum + Number(d.fundingShare), 0) ?? 0;
  const totalBalance =
    deals?.reduce((sum, d) => sum + Number(d.theirBalance), 0) ?? 0;
  const totalCollected =
    deals?.reduce((sum, d) => sum + Number(d.theirPaid), 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            {syndicator.team?.logoUrl && (
              <img
                src={syndicator.team.logoUrl}
                alt={syndicator.team.name ?? undefined}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-lg font-medium">
                {syndicator.team?.name || "Syndicator Portal"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Portal for {syndicator.name}
                {syndicator.companyName
                  ? ` \u2014 ${syndicator.companyName}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Deals</p>
            <p className="text-2xl font-mono font-medium">
              {deals?.length ?? 0}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Total Invested
            </p>
            <p className="text-2xl font-mono font-medium">
              ${totalInvested.toLocaleString()}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Current Balance
            </p>
            <p className="text-2xl font-mono font-medium">
              ${totalBalance.toLocaleString()}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Total Collected
            </p>
            <p className="text-2xl font-mono font-medium">
              ${totalCollected.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Capital Activity Summary */}
        {portalBalance && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Account Balance
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(portalBalance.availableBalance).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total Contributed
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(portalBalance.totalContributed).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total Withdrawn
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(portalBalance.totalWithdrawn).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Deals Table */}
        <div>
          <h2 className="text-sm font-medium mb-3">Your Syndicated Deals</h2>
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
                    Your Share
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Your Investment
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Your Balance
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Your Collected
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    NSFs
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
                      {(
                        Number(deal.ownershipPercentage) * 100
                      ).toFixed(1)}
                      %
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      ${Number(deal.fundingShare).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      ${Number(deal.theirBalance).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      ${Number(deal.theirPaid).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      {deal.nsfCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No syndicated deals yet.
            </p>
          )}
        </div>

        {/* Capital Activity History */}
        <div className="mt-8">
          <h2 className="text-sm font-medium mb-3">Capital Activity</h2>
          {portalTxResult?.data && portalTxResult.data.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Method
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Description
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
                    Deal
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Amount
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {portalTxResult.data.map((tx) => {
                  const isCredit = ["contribution", "refund"].includes(
                    tx.transactionType,
                  );

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border"
                    >
                      <td className="py-3 px-4 text-sm font-mono">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            isCredit
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700",
                          )}
                        >
                          {tx.transactionType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground uppercase">
                        {tx.method ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {tx.description ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {tx.dealCode ?? "—"}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-sm text-right font-mono",
                          isCredit ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {isCredit ? "+" : "−"}$
                        {Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        {tx.balanceAfter != null
                          ? `$${Number(tx.balanceAfter).toLocaleString()}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No capital activity recorded yet.
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
