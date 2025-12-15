"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Label } from "@midday/ui/label";
import { Skeleton } from "@midday/ui/skeleton";
import { Switch } from "@midday/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";

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
  visma: {
    name: "Visma",
    icon: "🔵",
    description: "Business software for the Nordics",
  },
} as const;

export function AccountingSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch connected accounting providers
  const { data: connections, isLoading } = useQuery(
    trpc.accounting.getConnections.queryOptions()
  );

  // Disconnect mutation
  const disconnectMutation = useMutation(
    trpc.accounting.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.accounting.getConnections.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.apps.getApps.queryKey(),
        });
      },
    })
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    trpc.apps.updateSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.accounting.getConnections.queryKey(),
        });
      },
    })
  );

  const handleSettingChange = (
    providerId: string,
    settingId: string,
    value: boolean
  ) => {
    const connection = connections?.find((c) => c.providerId === providerId);
    if (!connection?.settings) return;

    const currentSettings = Array.isArray(connection.settings)
      ? connection.settings
      : [];

    const updatedSettings = currentSettings.map(
      (setting: { id: string; value: unknown }) =>
        setting.id === settingId ? { ...setting, value } : setting
    );

    updateSettingsMutation.mutate({
      appId: providerId,
      settings: updatedSettings,
    });
  };

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
            Connect your accounting software to automatically sync transactions
            and receipts.
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
          Manage your connected accounting software and sync settings.
        </p>
      </div>

      {connections.map((connection) => {
        const providerInfo =
          PROVIDER_INFO[connection.providerId as keyof typeof PROVIDER_INFO];
        const settings = Array.isArray(connection.settings)
          ? connection.settings
          : [];

        const autoSyncSetting = settings.find(
          (s: { id: string }) => s.id === "autoSync"
        );
        const attachmentSetting = settings.find(
          (s: { id: string }) => s.id === "syncAttachments"
        );

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

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">Automatic Sync</Label>
                    <p className="text-xs text-[#878787]">
                      Automatically sync transactions daily
                    </p>
                  </div>
                  <Switch
                    checked={
                      (autoSyncSetting as { value?: boolean })?.value !== false
                    }
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        connection.providerId,
                        "autoSync",
                        checked
                      )
                    }
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">
                      Include Attachments
                    </Label>
                    <p className="text-xs text-[#878787]">
                      Upload receipts and invoices with transactions
                    </p>
                  </div>
                  <Switch
                    checked={
                      (attachmentSetting as { value?: boolean })?.value !== false
                    }
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        connection.providerId,
                        "syncAttachments",
                        checked
                      )
                    }
                    disabled={updateSettingsMutation.isPending}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    disconnectMutation.mutate({
                      providerId: connection.providerId as
                        | "xero"
                        | "quickbooks"
                        | "fortnox"
                        | "visma",
                    })
                  }
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

