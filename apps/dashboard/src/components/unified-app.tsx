import { useTRPC } from "@/trpc/client";
import type { UnifiedApp } from "@midday/app-store/types";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";

interface UnifiedAppProps {
  app: UnifiedApp;
  userEmail?: string;
}

export function UnifiedAppComponent({ app, userEmail }: UnifiedAppProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();
  const [params, setParams] = useQueryStates({
    app: parseAsString,
    settings: parseAsBoolean,
  });

  const disconnectOfficialAppMutation = useMutation(
    trpc.apps.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.apps.get.queryKey(),
        });
      },
    }),
  );

  const revokeExternalAppMutation = useMutation(
    trpc.oauthApplications.revokeAccess.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.authorized.queryKey(),
        });
      },
    }),
  );

  const handleDisconnect = () => {
    if (app.type === "official") {
      disconnectOfficialAppMutation.mutate({ appId: app.id });
    } else {
      revokeExternalAppMutation.mutate({ applicationId: app.id });
    }
  };

  const handleOnInitialize = async () => {
    setLoading(true);

    try {
      if (app.type === "official" && app.onInitialize) {
        await app.onInitialize();
      } else if (app.type === "external" && app.clientId) {
        // Redirect to OAuth consent screen
        const params = new URLSearchParams({
          client_id: app.clientId,
          redirect_uri:
            app.installUrl || `${window.location.origin}/oauth/callback`,
          scope: app.scopes?.join(" ") || "",
          response_type: "code",
        });

        router.push(`/oauth/authorize?${params.toString()}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card key={app.id} className="w-full flex flex-col">
      <Sheet open={params.app === app.id} onOpenChange={() => setParams(null)}>
        <div className="pt-6 px-6 h-16 flex items-center justify-between">
          {app.type === "official" &&
          app.logo &&
          typeof app.logo !== "string" ? (
            <app.logo />
          ) : (
            <img
              src={app.logo as string}
              alt={app.name}
              className="w-8 h-8 rounded"
            />
          )}

          <div className="flex items-center gap-2">
            {app.installed && (
              <div className="text-green-600 bg-green-100 text-[10px] dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full font-mono">
                Installed
              </div>
            )}
          </div>
        </div>

        <CardHeader className="pb-0">
          <div className="flex items-center space-x-2 pb-4">
            <CardTitle className="text-md font-medium leading-none p-0 m-0">
              {app.name}
            </CardTitle>
            {!app.active && (
              <span className="text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full font-mono">
                Coming soon
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#878787] pb-4">
          <p>{app.short_description}</p>
        </CardContent>

        <div className="px-6 pb-6 flex gap-2 mt-auto">
          <Button
            variant="outline"
            className="w-full"
            disabled={!app.active}
            onClick={() => setParams({ app: app.id })}
          >
            Details
          </Button>

          {app.installed ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDisconnect}
              disabled={
                disconnectOfficialAppMutation.isPending ||
                revokeExternalAppMutation.isPending
              }
            >
              {disconnectOfficialAppMutation.isPending ||
              revokeExternalAppMutation.isPending
                ? "Disconnecting..."
                : "Disconnect"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleOnInitialize}
              disabled={!app.active || isLoading}
            >
              {isLoading ? "Installing..." : "Install"}
            </Button>
          )}
        </div>

        <SheetContent>
          <SheetHeader>
            <div className="mb-4">
              <Image
                src={app.images[0] ?? ""}
                alt={app.name}
                width={465}
                height={290}
                quality={100}
              />
            </div>

            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center space-x-2">
                {app.type === "official" &&
                app.logo &&
                typeof app.logo !== "string" ? (
                  <app.logo />
                ) : (
                  <img
                    src={app.logo as string}
                    alt={app.name}
                    className="w-8 h-8 rounded"
                  />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg leading-none">{app.name}</h3>
                    {app.installed && (
                      <div className="bg-green-600 text-[9px] dark:bg-green-300 rounded-full size-1" />
                    )}
                  </div>

                  <span className="text-xs text-[#878787]">
                    {app.category} •{" "}
                    {app.type === "external"
                      ? `By ${app.developerName}`
                      : "By Midday"}
                  </span>
                </div>
              </div>

              <div>
                {app.installed ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDisconnect}
                    disabled={
                      disconnectOfficialAppMutation.isPending ||
                      revokeExternalAppMutation.isPending
                    }
                  >
                    {disconnectOfficialAppMutation.isPending ||
                    revokeExternalAppMutation.isPending
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-primary"
                    onClick={handleOnInitialize}
                    disabled={!app.active || isLoading}
                  >
                    {isLoading ? "Installing..." : "Install"}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-[#878787] leading-relaxed">
                      {app.description || app.overview}
                    </p>
                  </div>

                  {app.type === "external" && (
                    <>
                      {app.website && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Website</h4>
                          <a
                            href={app.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {app.website}
                          </a>
                        </div>
                      )}

                      {app.scopes && app.scopes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Permissions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {app.scopes.map((scope) => (
                              <Badge
                                key={scope}
                                variant="secondary"
                                className="text-xs"
                              >
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
