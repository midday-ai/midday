"use client";

import { BrokerForm } from "@/components/forms/broker-form";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Switch } from "@midday/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type BrokerData = {
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
  commissionPercentage: number | null;
  portalEnabled: boolean | null;
  portalId: string | null;
  status: string | null;
  note: string | null;
  createdAt: string;
  dealCount: number;
  activeDealCount: number;
  totalFundedAmount: number;
  totalCommissionsEarned: number;
  pendingCommissions: number;
  paidCommissions: number;
};

type Props = {
  brokerId: string;
  broker: BrokerData;
};

export function BrokerDetailContent({ brokerId, broker }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(
    null,
  );
  const [editRate, setEditRate] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const { data: deals } = useQuery(
    trpc.brokers.getDeals.queryOptions({ brokerId }),
  );

  const { data: commissions } = useQuery(
    trpc.brokers.getCommissions.queryOptions({ brokerId }),
  );

  const { data: dealStats } = useQuery(
    trpc.brokers.getDealStats.queryOptions({ brokerId }),
  );

  const togglePortalMutation = useMutation(
    trpc.brokers.togglePortal.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getById.queryKey({ id: brokerId }),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.brokers.delete.mutationOptions({
      onSuccess: () => {
        router.push("/brokers");
      },
    }),
  );

  const markPaidMutation = useMutation(
    trpc.brokers.updateCommission.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getCommissions.queryKey({ brokerId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getById.queryKey({ id: brokerId }),
        });
      },
    }),
  );

  const portalUrl = broker.portalId
    ? `${window.location.origin}/b/${broker.portalId}`
    : null;

  const stats = dealStats ?? {
    totalDeals: broker.dealCount,
    activeDeals: broker.activeDealCount,
    totalFunded: broker.totalFundedAmount,
    totalBalance: 0,
    totalPaid: 0,
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl py-6 px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            <Icons.ArrowBack size={16} />
          </Button>
          <h1 className="text-lg font-medium">Edit Broker</h1>
        </div>
        <BrokerForm
          defaultValues={{
            id: broker.id,
            name: broker.name,
            email: broker.email ?? undefined,
            phone: broker.phone ?? undefined,
            companyName: broker.companyName ?? undefined,
            website: broker.website ?? undefined,
            commissionPercentage: broker.commissionPercentage ?? undefined,
            addressLine1: broker.addressLine1 ?? undefined,
            addressLine2: broker.addressLine2 ?? undefined,
            city: broker.city ?? undefined,
            state: broker.state ?? undefined,
            zip: broker.zip ?? undefined,
            country: broker.country ?? undefined,
            note: broker.note ?? undefined,
          }}
          onSuccess={() => {
            setIsEditing(false);
            queryClient.invalidateQueries({
              queryKey: trpc.brokers.getById.queryKey({ id: brokerId }),
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
          <Link href="/brokers">
            <Button variant="ghost" size="sm">
              <Icons.ArrowBack size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium">{broker.name}</h1>
            {broker.companyName && (
              <p className="text-sm text-muted-foreground">
                {broker.companyName}
              </p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ml-2",
              broker.status === "active"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {broker.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this broker?")) {
                deleteMutation.mutate({ id: brokerId });
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
          <p className="text-2xl font-mono font-medium">{stats.totalDeals}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Deals</p>
          <p className="text-2xl font-mono font-medium">{stats.activeDeals}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Funded</p>
          <p className="text-2xl font-mono font-medium">
            ${Number(stats.totalFunded).toLocaleString()}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Commissions Earned
          </p>
          <p className="text-2xl font-mono font-medium">
            ${Number(broker.totalCommissionsEarned).toLocaleString()}
          </p>
          {broker.pendingCommissions > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              ${Number(broker.pendingCommissions).toLocaleString()} pending
            </p>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-8">
        <h2 className="text-sm font-medium mb-3">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {broker.email && (
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              <a href={`mailto:${broker.email}`} className="hover:text-primary">
                {broker.email}
              </a>
            </div>
          )}
          {broker.phone && (
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {broker.phone}
            </div>
          )}
          {broker.website && (
            <div>
              <span className="text-muted-foreground">Website:</span>{" "}
              <a
                href={broker.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {broker.website}
              </a>
            </div>
          )}
          {broker.commissionPercentage != null && (
            <div>
              <span className="text-muted-foreground">Default Commission:</span>{" "}
              <span className="font-mono">{broker.commissionPercentage}%</span>
            </div>
          )}
        </div>
        {(broker.addressLine1 || broker.city) && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Address:</span>{" "}
            {[
              broker.addressLine1,
              broker.addressLine2,
              broker.city,
              broker.state,
              broker.zip,
              broker.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}
        {broker.note && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Notes:</span>{" "}
            {broker.note}
          </div>
        )}
      </div>

      {/* Portal Section */}
      <div className="mb-8 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Broker Portal</h2>
          <Switch
            checked={broker.portalEnabled ?? false}
            onCheckedChange={(checked) => {
              togglePortalMutation.mutate({
                brokerId,
                enabled: checked,
              });
            }}
          />
        </div>
        {broker.portalEnabled && portalUrl && (
          <div className="flex items-center gap-2">
            <Input value={portalUrl} readOnly className="text-sm" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(portalUrl)}
            >
              Copy
            </Button>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Open
              </Button>
            </a>
          </div>
        )}
        {!broker.portalEnabled && (
          <p className="text-sm text-muted-foreground">
            Enable the portal to give this broker read-only access to their
            deals.
          </p>
        )}
      </div>

      {/* Deals Table */}
      <div className="mb-8">
        <h2 className="text-sm font-medium mb-3">Deals</h2>
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
                  Funded
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Balance
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Commission
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
                  <td className="py-2 px-3 text-sm">{deal.merchantName}</td>
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
                    ${Number(deal.fundingAmount).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    ${Number(deal.currentBalance).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-sm text-right font-mono">
                    {deal.commissionAmount
                      ? `$${Number(deal.commissionAmount).toLocaleString()}`
                      : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No deals originated by this broker yet.
          </p>
        )}
      </div>

      {/* Commissions Table */}
      <div>
        <h2 className="text-sm font-medium mb-3">Commission Ledger</h2>
        {commissions && commissions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Deal
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Merchant
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Rate
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Amount
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-2 px-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((comm) => {
                const isEditingThis = editingCommissionId === comm.id;
                return (
                  <tr
                    key={comm.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="py-2 px-3 text-sm font-mono">
                      {comm.dealCode}
                    </td>
                    <td className="py-2 px-3 text-sm">{comm.merchantName}</td>
                    <td className="py-2 px-3 text-sm text-right font-mono">
                      {isEditingThis ? (
                        <Input
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          type="number"
                          step="0.01"
                          className="w-20 h-7 text-right text-sm font-mono ml-auto"
                        />
                      ) : (
                        `${comm.commissionPercentage}%`
                      )}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-mono">
                      {isEditingThis ? (
                        <Input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          type="number"
                          step="0.01"
                          className="w-28 h-7 text-right text-sm font-mono ml-auto"
                        />
                      ) : (
                        `$${Number(comm.commissionAmount).toLocaleString()}`
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          comm.status === "paid"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : comm.status === "pending"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                        )}
                      >
                        {comm.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditingThis ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                markPaidMutation.mutate({
                                  id: comm.id,
                                  commissionPercentage: Number(editRate),
                                  commissionAmount: Number(editAmount),
                                });
                                setEditingCommissionId(null);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground"
                              onClick={() => setEditingCommissionId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setEditingCommissionId(comm.id);
                                setEditRate(
                                  String(comm.commissionPercentage ?? ""),
                                );
                                setEditAmount(
                                  String(comm.commissionAmount ?? ""),
                                );
                              }}
                            >
                              Edit
                            </Button>
                            {comm.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() =>
                                  markPaidMutation.mutate({
                                    id: comm.id,
                                    status: "paid",
                                  })
                                }
                              >
                                Mark Paid
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No commissions recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
