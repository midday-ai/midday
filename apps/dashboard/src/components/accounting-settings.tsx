"use client";

import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";

// Provider display information
const PROVIDER_INFO = {
  xero: {
    name: "Xero",
    icon: "🟢",
    description: "Accounting software for small businesses",
  },
  quickbooks: {
    name: "QuickBooks",
    icon: "🟢",
    description: "QuickBooks Online accounting",
  },
  fortnox: {
    name: "Fortnox",
    icon: "🟣",
    description: "Swedish business software",
  },
} as const;

export function AccountingSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch connected accounting providers
  const { data: connections, isLoading } = useQuery(
    trpc.accounting.getConnections.queryOptions(),
  );

  // Disconnect mutation
  const disconnectMutation = useMutation(
    trpc.accounting.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.accounting.getConnections.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.apps.get.queryKey(),
        });
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accounting Integrations</CardTitle>
          <CardDescription>
            Connect your accounting software to export transactions and
            receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-[#878787] mb-4">
              No accounting software connected yet.
            </p>
            <Button asChild variant="outline">
              <Link href="/settings/apps">Browse Integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium">Accounting Integrations</h3>
        <p className="text-sm text-[#878787]">
          Manage your connected accounting software. Export transactions from
          the Transactions page.
        </p>
      </div>

      {connections.map((connection) => {
        const providerInfo =
          PROVIDER_INFO[connection.providerId as keyof typeof PROVIDER_INFO];

        return (
          <Card key={connection.providerId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{providerInfo?.icon ?? "📊"}</span>
                  <div>
                    <CardTitle className="text-base">
                      {providerInfo?.name ?? connection.providerId}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {connection.tenantName}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-green-600 bg-green-100 text-[10px] dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full font-mono">
                    Connected
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-[#878787]">
                Connected{" "}
                {connection.connectedAt
                  ? format(new Date(connection.connectedAt), "MMM d, yyyy")
                  : ""}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    disconnectMutation.mutate({
                      providerId: connection.providerId as
                        | "xero"
                        | "quickbooks"
                        | "fortnox",
                    })
                  }
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending
                    ? "Disconnecting..."
                    : "Disconnect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
