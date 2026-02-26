"use client";

import { SyndicatorForm } from "@/components/forms/syndicator-form";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Switch } from "@midday/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SyndicatorData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  portalEnabled: boolean | null;
  portalId: string | null;
  status: string | null;
  note: string | null;
  createdAt: string;
  dealCount: number;
  activeDealCount: number;
  totalFundingShare: number;
};

type Props = {
  syndicatorId: string;
  syndicator: SyndicatorData;
};

export function SyndicatorDetailContent({
  syndicatorId,
  syndicator,
}: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: deals } = useQuery(
    trpc.syndication.getDeals.queryOptions({ syndicatorId }),
  );

  const { data: dealStats } = useQuery(
    trpc.syndication.getDealStats.queryOptions({ syndicatorId }),
  );

  const { data: balance } = useQuery(
    trpc.syndication.getBalance.queryOptions({ syndicatorId }),
  );

  const { data: txResult } = useQuery(
    trpc.syndication.getTransactions.queryOptions({ syndicatorId }),
  );

  const togglePortalMutation = useMutation(
    trpc.syndication.togglePortal.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.syndication.getById.queryKey({ id: syndicatorId }),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.syndication.delete.mutationOptions({
      onSuccess: () => {
        router.push("/syndications");
      },
    }),
  );

  const portalUrl = syndicator.portalId
    ? `${window.location.origin}/s/${syndicator.portalId}`
    : null;

  const stats = dealStats ?? {
    totalDeals: syndicator.dealCount,
    activeDeals: syndicator.activeDealCount,
    totalFundingShare: syndicator.totalFundingShare,
    totalProportionalBalance: 0,
    totalProportionalPaid: 0,
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            <Icons.ArrowBack size={16} />
          </Button>
          <h1 className="text-lg font-medium">Edit Syndicator</h1>
        </div>
        <SyndicatorForm
          defaultValues={{
            id: syndicator.id,
            name: syndicator.name,
            email: syndicator.email ?? undefined,
            phone: syndicator.phone ?? undefined,
            companyName: syndicator.companyName ?? undefined,
            website: syndicator.website ?? undefined,
            addressLine1: syndicator.addressLine1 ?? undefined,
            addressLine2: syndicator.addressLine2 ?? undefined,
            city: syndicator.city ?? undefined,
            state: syndicator.state ?? undefined,
            zip: syndicator.zip ?? undefined,
            country: syndicator.country ?? undefined,
            note: syndicator.note ?? undefined,
          }}
          onSuccess={() => {
            setIsEditing(false);
            queryClient.invalidateQueries({
              queryKey: trpc.syndication.getById.queryKey({
                id: syndicatorId,
              }),
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/syndications">
            <Button variant="ghost" size="sm">
              <Icons.ArrowBack size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium">{syndicator.name}</h1>
            {syndicator.companyName && (
              <p className="text-sm text-muted-foreground">
                {syndicator.companyName}
              </p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ml-2",
              syndicator.status === "active"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {syndicator.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete this syndicator?",
                )
              ) {
                deleteMutation.mutate({ id: syndicatorId });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Deals</p>
          <p className="text-2xl font-mono font-medium">
            {stats.totalDeals}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Deals</p>
          <p className="text-2xl font-mono font-medium">
            {stats.activeDeals}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Total Invested
          </p>
          <p className="text-2xl font-mono font-medium">
            ${Number(stats.totalFundingShare).toLocaleString()}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Proportional Balance
          </p>
          <p className="text-2xl font-mono font-medium">
            ${Number(stats.totalProportionalBalance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-8">
        <h2 className="text-sm font-medium mb-3">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {syndicator.email && (
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              <a
                href={`mailto:${syndicator.email}`}
                className="hover:text-primary"
              >
                {syndicator.email}
              </a>
            </div>
          )}
          {syndicator.phone && (
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {syndicator.phone}
            </div>
          )}
          {syndicator.website && (
            <div>
              <span className="text-muted-foreground">Website:</span>{" "}
              <a
                href={syndicator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {syndicator.website}
              </a>
            </div>
          )}
        </div>
        {(syndicator.addressLine1 || syndicator.city) && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Address:</span>{" "}
            {[
              syndicator.addressLine1,
              syndicator.addressLine2,
              syndicator.city,
              syndicator.state,
              syndicator.zip,
              syndicator.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}
        {syndicator.note && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Notes:</span>{" "}
            {syndicator.note}
          </div>
        )}
      </div>

      {/* Portal Section */}
      <div className="mb-8 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Syndicator Portal</h2>
          <Switch
            checked={syndicator.portalEnabled ?? false}
            onCheckedChange={(checked) => {
              togglePortalMutation.mutate({
                syndicatorId,
                enabled: checked,
              });
            }}
          />
        </div>
        {syndicator.portalEnabled && portalUrl && (
          <div className="flex items-center gap-2">
            <Input value={portalUrl} readOnly className="text-sm" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(portalUrl)}
            >
              Copy
            </Button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Open
              </Button>
            </a>
          </div>
        )}
        {!syndicator.portalEnabled && (
          <p className="text-sm text-muted-foreground">
            Enable the portal to give this syndicator read-only access to
            their proportional deal data.
          </p>
        )}
      </div>

      {/* Deals Table */}
      <div className="mb-8">
        <h2 className="text-sm font-medium mb-3">Syndicated Deals</h2>
        {deals && deals.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Deal Code
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Merchant
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Ownership
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Their Share
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Their Balance
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Their Paid
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  NSFs
                </th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-border hover:bg-muted/50"
                >
                  <td className="py-2 px-3 text-sm font-mono">
                    {deal.dealCode}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    {deal.merchantName}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        deal.status === "active"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : deal.status === "paid_off"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                      )}
                    >
                      {deal.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    {(Number(deal.ownershipPercentage) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    ${Number(deal.fundingShare).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    ${Number(deal.theirBalance).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    ${Number(deal.theirPaid).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    {deal.nsfCount ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No syndicated deals yet.
          </p>
        )}
      </div>

      {/* Capital Activity */}
      <div className="mb-8">
        <h2 className="text-sm font-medium mb-3">Capital Activity</h2>

        {/* Balance Summary */}
        {balance && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Available Balance
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(balance.availableBalance).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total Contributed
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(balance.totalContributed).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total Withdrawn
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(balance.totalWithdrawn).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Profit Distributed
              </p>
              <p className="text-2xl font-mono font-medium">
                ${Number(balance.totalDistributed).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Transaction History */}
        {txResult?.data && txResult.data.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Method
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Description
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Deal
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Amount
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {txResult.data.map((tx) => {
                const isCredit = ["contribution", "refund"].includes(
                  tx.transactionType,
                );
                const isTransferIn =
                  tx.transactionType === "transfer" &&
                  !tx.counterpartySyndicatorId;
                const positive = isCredit || isTransferIn;

                return (
                  <tr
                    key={tx.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="py-2 px-3 text-sm font-mono">
                      {tx.date}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          positive
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                        )}
                      >
                        {tx.transactionType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm text-muted-foreground uppercase">
                      {tx.method ?? "—"}
                    </td>
                    <td className="py-2 px-3 text-sm">
                      {tx.description ?? "—"}
                    </td>
                    <td className="py-2 px-3 text-sm font-mono">
                      {tx.dealCode ?? "—"}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          tx.status === "completed"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : tx.status === "failed" ||
                                tx.status === "reversed"
                              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-2 px-3 text-sm text-right font-mono",
                        positive ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {positive ? "+" : "−"}$
                      {Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-mono">
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
          <p className="text-sm text-muted-foreground py-4">
            No capital activity recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
