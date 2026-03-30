"use client";

import { connectorApps } from "@midday/connectors";
import type { ConnectorApp } from "@midday/connectors/types";
import { LogEvents } from "@midday/events/events";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Skeleton } from "@midday/ui/skeleton";
import { useOpenPanel } from "@openpanel/nextjs";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import Image from "next/image";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useTRPC } from "@/trpc/client";

type Connector = {
  slug: string;
  name: string;
  logo: string | null;
  description: string | null;
  isConnected: boolean;
  connectedAccountId: string | null;
};

const connectorDataMap = new Map<string, ConnectorApp>(
  connectorApps.map((c) => [c.slug, c]),
);

function toConnectorSlug(composioSlug: string): string {
  return `connector-${composioSlug.replace(/_/g, "-")}`;
}

function ConnectorLogo({
  src,
  name,
  size = 32,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="bg-muted flex items-center justify-center text-xs font-medium shrink-0"
        style={{ width: size, height: size }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="shrink-0"
      unoptimized
    />
  );
}

function ConnectorCard({
  connector,
  onSelect,
  onConnect,
}: {
  connector: Connector;
  onSelect: (c: Connector) => void;
  onConnect: (slug: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-track="Connector Viewed"
      data-connector={connector.name}
      onClick={() => onSelect(connector)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(connector);
        }
      }}
      className="flex items-start justify-between w-full p-3 border border-border hover:bg-accent/50 transition-colors text-left cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <ConnectorLogo src={connector.logo} name={connector.name} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {connector.name}
            </span>
            {connector.isConnected && (
              <span className="size-2 rounded-full bg-green-500 shrink-0" />
            )}
          </div>
          {connector.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {connector.description}
            </p>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 size-5 mt-0.5 p-0 [&_svg]:!size-3"
        onClick={(e) => {
          e.stopPropagation();
          if (!connector.isConnected) {
            onConnect(connector.slug);
          }
        }}
      >
        {connector.isConnected ? <Icons.Check /> : <Icons.Add />}
      </Button>
    </div>
  );
}

function ConnectorDetailEnrichment({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.connectors.detail.queryOptions({ slug }),
  );

  if (isLoading) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded-none" />
            <Skeleton className="h-5 w-5 rounded-none" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-20 rounded-none" />
            <Skeleton className="h-6 w-24 rounded-none" />
            <Skeleton className="h-6 w-16 rounded-none" />
          </div>
        </div>
        <div className="border-t border-border pt-4 space-y-3">
          <Skeleton className="h-4 w-16 rounded-none" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <Skeleton className="h-3 w-20 rounded-none" />
            <Skeleton className="h-3 w-24 rounded-none" />
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Tools as pill badges */}
      {data.tools.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Tools</span>
            <Badge variant="tag">{data.toolsCount}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.tools.map((tool) => (
              <Badge key={tool.slug} variant="tag" className="capitalize">
                {tool.slug.split("_").pop()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="border-t border-border pt-4">
        <span className="text-sm font-medium">Details</span>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-3">
          {data.categories.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground block mb-1">
                Category
              </span>
              <span className="text-xs text-foreground">
                {data.categories.map((c) => c.name).join(", ")}
              </span>
            </div>
          )}

          {data.authSchemes.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground block mb-1">
                Auth
              </span>
              <span className="text-xs text-foreground">
                {data.authSchemes
                  .map((s) => s.replace(/_/g, " ").toUpperCase())
                  .join(", ")}
              </span>
            </div>
          )}

          {data.appUrl && (
            <div>
              <span className="text-xs text-muted-foreground block mb-1">
                Website
              </span>
              <a
                href={data.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-foreground hover:underline inline-flex items-center gap-1"
              >
                {new URL(data.appUrl).hostname}
                <Icons.ExternalLink className="size-2.5" />
              </a>
            </div>
          )}

          {data.triggersCount > 0 && (
            <div>
              <span className="text-xs text-muted-foreground block mb-1">
                Triggers
              </span>
              <span className="text-xs text-foreground">
                {data.triggersCount} available
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ConnectorDetail({
  connector,
  onBack,
  onConnect,
  onDisconnect,
  isConnecting,
}: {
  connector: Connector;
  onBack: () => void;
  onConnect: (slug: string) => void;
  onDisconnect: (connectedAccountId: string) => void;
  isConnecting: boolean;
}) {
  const connectorSlug = toConnectorSlug(connector.slug);
  const localData = connectorDataMap.get(connectorSlug);

  return (
    <div className="flex flex-col h-full">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit mb-4 shrink-0"
      >
        <Icons.ChevronLeft className="size-3.5" />
        Back
      </button>

      <ScrollArea className="flex-1 min-h-0" hideScrollbar>
        <div className="space-y-5">
          {/* Hero: logo + name + short desc + connect button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <ConnectorLogo
                src={connector.logo}
                name={connector.name}
                size={40}
              />
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium leading-tight">
                    {connector.name}
                  </h3>
                  {connector.isConnected && (
                    <span className="size-2 rounded-full bg-green-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {localData?.short_description || connector.description}
                </p>
              </div>
            </div>

            {connector.isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  if (connector.connectedAccountId) {
                    onDisconnect(connector.connectedAccountId);
                  }
                }}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={isConnecting}
                onClick={() => onConnect(connector.slug)}
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {localData?.description ||
              `Connect ${connector.name} to Midday to let the AI assistant access and interact with your ${connector.name} data.`}
          </p>

          {/* Rich data from API */}
          <ConnectorDetailEnrichment slug={connector.slug} />
        </div>
      </ScrollArea>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <Input
        placeholder={`Search ${connectorApps.filter((c) => c.active).length} apps...`}
        disabled
        className="shrink-0 mb-3"
      />

      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i.toString()}
            className="flex items-center gap-3 p-3 border border-border"
          >
            <Skeleton className="size-8 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded-none" />
              <Skeleton className="h-3 w-32 rounded-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectorsContent({
  open,
  onDetailChange,
}: {
  open: boolean;
  onDetailChange: (isDetail: boolean) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { track } = useOpenPanel();
  const [search, setSearch] = useState("");
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: catalog } = useSuspenseQuery(
    trpc.connectors.list.queryOptions(undefined, {
      staleTime: 30 * 60 * 1000,
    }),
  );

  const { data: connections } = useQuery(
    trpc.connectors.connections.queryOptions(undefined, {
      staleTime: 2 * 60 * 1000,
    }),
  );

  const connectors: Connector[] = useMemo(() => {
    const connMap = new Map(
      (connections ?? []).map((c) => [c.slug, c.connectedAccountId]),
    );
    return catalog.map((c) => ({
      ...c,
      isConnected: connMap.has(c.slug),
      connectedAccountId: connMap.get(c.slug) ?? null,
    }));
  }, [catalog, connections]);

  const filtered = useMemo(() => {
    if (!search.trim()) return connectors;
    const q = search.toLowerCase();
    return connectors.filter(
      (c: Connector) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [connectors, search]);

  const invalidateConnectors = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: trpc.connectors.list.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.connectors.connections.queryKey(),
    });
  }, [queryClient, trpc]);

  const authorizeMutation = useMutation(
    trpc.connectors.authorize.mutationOptions(),
  );

  const disconnectMutation = useMutation(
    trpc.connectors.disconnect.mutationOptions({
      onSuccess: () => {
        invalidateConnectors();
        setSelectedConnector(null);
      },
    }),
  );

  const handleConnect = useCallback(
    async (slug: string) => {
      setIsConnecting(true);
      try {
        const callbackUrl = `${window.location.origin}/connectors/callback`;
        const result = await authorizeMutation.mutateAsync({
          toolkit: slug,
          callbackUrl,
        });

        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2.5;

        const redirectUrl = result.redirectUrl;
        if (!redirectUrl) {
          setIsConnecting(false);
          return;
        }

        const popup = window.open(
          redirectUrl,
          "composio_auth",
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`,
        );

        if (!popup) {
          window.location.href = redirectUrl;
          return;
        }

        const listener = (e: MessageEvent) => {
          if (e.data === "connector_oauth_completed") {
            window.removeEventListener("message", listener);
            setIsConnecting(false);
            invalidateConnectors();
            setSelectedConnector(null);
            track(LogEvents.ConnectorConnected.name, { connector: slug });
          }
        };

        window.addEventListener("message", listener);

        const checkInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkInterval);
            window.removeEventListener("message", listener);
            setIsConnecting(false);
            invalidateConnectors();
          }
        }, 500);

        setTimeout(
          () => {
            clearInterval(checkInterval);
            window.removeEventListener("message", listener);
            setIsConnecting(false);
          },
          5 * 60 * 1000,
        );
      } catch {
        setIsConnecting(false);
      }
    },
    [authorizeMutation, invalidateConnectors],
  );

  const handleDisconnect = useCallback(
    (connectedAccountId: string) => {
      track(LogEvents.ConnectorDisconnected.name, { connectedAccountId });
      disconnectMutation.mutate({ connectedAccountId });
    },
    [disconnectMutation, track],
  );

  useEffect(() => {
    if (open) {
      track(LogEvents.ConnectorModalOpened.name);
    } else {
      setSearch("");
      setSelectedConnector(null);
      setIsConnecting(false);
    }
  }, [open, track]);

  useEffect(() => {
    onDetailChange(selectedConnector !== null);
  }, [selectedConnector, onDetailChange]);

  if (selectedConnector) {
    const current = connectors.find(
      (c: Connector) => c.slug === selectedConnector.slug,
    );

    return (
      <ConnectorDetail
        connector={current ?? selectedConnector}
        onBack={() => setSelectedConnector(null)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnecting={isConnecting}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Input
        placeholder={`Search ${connectorApps.filter((c) => c.active).length} apps...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        className="shrink-0 mb-3"
      />

      <ScrollArea className="flex-1 min-h-0" hideScrollbar>
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((connector: Connector) => (
            <ConnectorCard
              key={connector.slug}
              connector={connector}
              onSelect={setSelectedConnector}
              onConnect={handleConnect}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No apps found
          </p>
        )}
      </ScrollArea>
    </div>
  );
}

export function ConnectorsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isDetail, setIsDetail] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <div className="p-4 h-[500px] flex flex-col">
          {!isDetail && (
            <DialogHeader className="mb-4 shrink-0">
              <DialogTitle>Connected apps</DialogTitle>
              <DialogDescription>
                Connect your apps and services to Midday. Your AI assistant can
                then access and interact with them.
              </DialogDescription>
            </DialogHeader>
          )}

          <div className="flex-1 min-h-0">
            <Suspense fallback={<GridSkeleton />}>
              <ConnectorsContent open={open} onDetailChange={setIsDetail} />
            </Suspense>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
