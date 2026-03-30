import type { UnifiedApp } from "@midday/app-store/types";
import { openUrl } from "@midday/desktop-client/core";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { createClient } from "@midday/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { useAppOAuth } from "@/hooks/use-app-oauth";
import { useTRPC } from "@/trpc/client";
import { getScopeDescription } from "@/utils/scopes";
import { AppSettings } from "./app-settings";
import { MemoizedReactMarkdown } from "./markdown";
import {
  ChatGPTSetupInstructions,
  ClaudeSetupInstructions,
  ClineSetupInstructions,
  GeminiSetupInstructions,
  ManusSetupInstructions,
  WindsurfSetupInstructions,
  ZedSetupInstructions,
} from "./mcp-setup-instructions";

// OAuth app configuration
const oauthAppConfig: Record<
  string,
  { endpoint: string; queryKey: "apps" | "inboxAccounts" | "stripeStatus" }
> = {
  slack: { endpoint: "/apps/slack/install-url", queryKey: "apps" },
  gmail: { endpoint: "/apps/gmail/install-url", queryKey: "inboxAccounts" },
  outlook: { endpoint: "/apps/outlook/install-url", queryKey: "inboxAccounts" },
  xero: { endpoint: "/apps/xero/install-url", queryKey: "apps" },
  quickbooks: { endpoint: "/apps/quickbooks/install-url", queryKey: "apps" },
  fortnox: { endpoint: "/apps/fortnox/install-url", queryKey: "apps" },
  "stripe-payments": {
    endpoint: "/invoice-payments/connect-stripe",
    queryKey: "stripeStatus",
  },
};

function ConnectorDetailContent({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.connectors.detail.queryOptions({ slug }),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <Accordion
      type="multiple"
      defaultValue={["about", "tools"]}
      className="mt-4"
    >
      <AccordionItem value="about" className="border-none">
        <AccordionTrigger>About</AccordionTrigger>
        <AccordionContent className="text-[#878787] text-sm">
          <p>{data.description}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.categories.map((cat) => (
              <Badge key={cat.slug} variant="tag">
                {cat.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs">
            <span>{data.toolsCount} tools available</span>
            {data.triggersCount > 0 && (
              <span>{data.triggersCount} triggers</span>
            )}
          </div>

          {data.appUrl && (
            <a
              href={data.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs mt-3 hover:underline"
            >
              Visit website
              <Icons.ExternalLink className="size-3" />
            </a>
          )}
        </AccordionContent>
      </AccordionItem>

      {data.tools.length > 0 && (
        <AccordionItem value="tools" className="border-none">
          <AccordionTrigger>
            Available tools ({data.tools.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {data.tools.map((tool) => (
                <div key={tool.slug}>
                  <div className="flex items-start gap-2">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tool.name}
                      </p>
                      <p className="text-xs text-[#878787] line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {data.authSchemes.length > 0 && (
        <AccordionItem value="auth" className="border-none">
          <AccordionTrigger>Authentication</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-1.5">
              {data.authSchemes.map((scheme) => (
                <Badge key={scheme} variant="tag">
                  {scheme.replace(/_/g, " ").toUpperCase()}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

interface UnifiedAppProps {
  app: UnifiedApp;
  userEmail?: string;
}

function AppHeroBanner({ app }: { app: UnifiedApp }) {
  return (
    <div
      className="relative w-full flex items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-[#0c0c0c]"
      style={{ height: 200 }}
    >
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, #e0e0e0 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: "radial-gradient(circle, #333 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />

      <div className="relative z-10 app-hero-icon">
        {app.type === "official" && app.logo && typeof app.logo !== "string" ? (
          <app.logo />
        ) : (
          <img src={app.logo as string} alt={app.name} />
        )}
        <style>
          {
            ".app-hero-icon img, .app-hero-icon svg { width: 64px !important; height: 64px !important; }"
          }
        </style>
      </div>
    </div>
  );
}

export function UnifiedAppComponent({ app }: UnifiedAppProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setLoading] = useState(false);
  const [params, setParams] = useQueryStates({
    app: parseAsString,
    settings: parseAsBoolean,
  });

  // Get OAuth config for this app (if it's an OAuth app)
  const oauthConfig = oauthAppConfig[app.id];

  // Use hook for OAuth apps
  const appOAuth = useAppOAuth({
    installUrlEndpoint: oauthConfig?.endpoint ?? "",
    onSuccess: () => {
      if (oauthConfig?.queryKey === "inboxAccounts") {
        queryClient.invalidateQueries({
          queryKey: trpc.inboxAccounts.get.queryKey(),
        });
      } else if (oauthConfig?.queryKey === "stripeStatus") {
        queryClient.invalidateQueries({
          queryKey: trpc.invoicePayments.stripeStatus.queryKey(),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: trpc.apps.get.queryKey(),
        });
      }
      setLoading(false);
    },
    onError: () => {
      // Show toast notification - error details are also visible in the popup window
      toast({
        title: "Connection failed",
        description: `Failed to connect ${app.name}. Please try again.`,
        variant: "error",
      });
      setLoading(false);
    },
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

  // Mutation to disconnect inbox accounts (Gmail/Outlook)
  const disconnectInboxAccountMutation = useMutation(
    trpc.inboxAccounts.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inboxAccounts.get.queryKey(),
        });
      },
    }),
  );

  const connectorAuthorizeMutation = useMutation(
    trpc.connectors.authorize.mutationOptions(),
  );

  const connectorDisconnectMutation = useMutation(
    trpc.connectors.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.connectors.list.queryKey(),
        });
      },
    }),
  );

  // Mutation to disconnect Stripe Payments
  const disconnectStripeMutation = useMutation(
    trpc.invoicePayments.disconnectStripe.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoicePayments.stripeStatus.queryKey(),
        });
      },
    }),
  );

  // Computed loading states
  const isInstalling = isLoading || appOAuth.isLoading;
  const isDisconnecting =
    disconnectOfficialAppMutation.isPending ||
    revokeExternalAppMutation.isPending ||
    disconnectInboxAccountMutation.isPending ||
    disconnectStripeMutation.isPending ||
    connectorDisconnectMutation.isPending;

  const handleDisconnect = () => {
    // Gmail and Outlook use inbox_accounts table
    if ((app.id === "gmail" || app.id === "outlook") && app.inboxAccountId) {
      disconnectInboxAccountMutation.mutate({ id: app.inboxAccountId });
      return;
    }

    // Stripe Payments uses team.stripeAccountId
    if (app.id === "stripe-payments") {
      disconnectStripeMutation.mutate();
      return;
    }

    if (app.type === "connector" && app.connectedAccountId) {
      connectorDisconnectMutation.mutate({
        connectedAccountId: app.connectedAccountId,
      });
      return;
    }

    if (app.type === "official") {
      disconnectOfficialAppMutation.mutate({ appId: app.id });
    } else {
      revokeExternalAppMutation.mutate({ applicationId: app.id });
    }
  };

  const handleOnInitialize = async () => {
    setLoading(true);

    try {
      if (app.type === "connector" && app.connectorSlug) {
        const callbackUrl = `${window.location.origin}/connectors/callback`;
        const result = await connectorAuthorizeMutation.mutateAsync({
          toolkit: app.connectorSlug,
          callbackUrl,
        });

        const redirectUrl = result.redirectUrl;
        if (!redirectUrl) {
          setLoading(false);
          return;
        }

        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2.5;

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
            queryClient.invalidateQueries({
              queryKey: trpc.connectors.list.queryKey(),
            });
            setLoading(false);
          }
        };

        window.addEventListener("message", listener);

        const checkInterval = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkInterval);
            window.removeEventListener("message", listener);
            queryClient.invalidateQueries({
              queryKey: trpc.connectors.list.queryKey(),
            });
            setLoading(false);
          }
        }, 500);

        setTimeout(
          () => {
            clearInterval(checkInterval);
            window.removeEventListener("message", listener);
            setLoading(false);
          },
          5 * 60 * 1000,
        );

        return;
      }

      // Use OAuth hook for configured apps
      if (oauthConfig) {
        await appOAuth.connect();
        return;
      }

      // Handle apps with installUrl (like Midday Desktop download page)
      if (app.installUrl) {
        if (isDesktopApp()) {
          openUrl(app.installUrl);
        } else {
          window.open(app.installUrl, "_blank");
        }
        setLoading(false);
        return;
      }

      if (app.onInitialize) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        // Set up a timeout to clear loading state if callback doesn't fire
        const timeoutId = setTimeout(() => {
          setLoading(false);
        }, 30000); // 30 second timeout as fallback

        await app.onInitialize({
          accessToken: session.access_token,
          onComplete: () => {
            clearTimeout(timeoutId);
            // Invalidate queries to refresh the app status
            // Note: The global listener in Apps component also handles this as a fallback
            queryClient.invalidateQueries({
              queryKey: trpc.apps.get.queryKey(),
            });
            setLoading(false);
          },
        });
      }
    } catch (_error) {
      setLoading(false);
    }
  };

  const isMcpApp = app.id.endsWith("-mcp");

  return (
    <Card key={app.id} className="w-full flex flex-col">
      <Sheet open={params.app === app.id} onOpenChange={() => setParams(null)}>
        <div className="pt-6 px-6 h-16 flex items-center justify-between">
          {app.type === "official" &&
          app.logo &&
          typeof app.logo !== "string" ? (
            <app.logo />
          ) : (
            <img src={app.logo as string} alt={app.name} className="w-8 h-8" />
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
            {app.active && app.beta && (
              <span className="text-[#1D1D1D] bg-[#e6e6e6] text-[10px] dark:bg-[#2c2c2c] dark:text-[#F2F1EF] px-3 py-1 rounded-full font-mono">
                Beta
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

          {!isMcpApp &&
            (app.installUrl ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOnInitialize}
                disabled={!app.active}
              >
                {app.id === "midday-desktop" ? "Download" : "Install"}
              </Button>
            ) : app.installed ? (
              <SubmitButton
                variant="outline"
                className="w-full"
                onClick={handleDisconnect}
                isSubmitting={isDisconnecting}
              >
                Disconnect
              </SubmitButton>
            ) : (
              <SubmitButton
                variant="outline"
                className="w-full"
                onClick={handleOnInitialize}
                disabled={!app.active}
                isSubmitting={isInstalling}
              >
                Install
              </SubmitButton>
            ))}
        </div>

        <SheetContent>
          <SheetHeader className="h-full overflow-hidden">
            <div className="mb-4 shrink-0">
              <AppHeroBanner app={app} />
            </div>

            <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg leading-none">{app.name}</h3>
                  {app.installed && (
                    <div className="bg-green-600 text-[9px] dark:bg-green-300 rounded-full size-1" />
                  )}
                </div>

                <span className="text-xs text-[#878787]">
                  {app.category} •{" "}
                  {app.type === "connector"
                    ? "Connected app"
                    : app.type === "external"
                      ? `By ${app.developerName}`
                      : "By Midday"}
                </span>
              </div>

              {!isMcpApp && (
                <div>
                  {app.installed ? (
                    <SubmitButton
                      variant="outline"
                      className="w-full"
                      onClick={handleDisconnect}
                      isSubmitting={isDisconnecting}
                    >
                      Disconnect
                    </SubmitButton>
                  ) : (
                    <SubmitButton
                      variant="outline"
                      className="w-full border-primary"
                      onClick={handleOnInitialize}
                      disabled={!app.active}
                      isSubmitting={isInstalling}
                    >
                      {app.id === "midday-desktop" ? "Download" : "Install"}
                    </SubmitButton>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 h-0" hideScrollbar>
                {app.type === "connector" && app.connectorSlug ? (
                  <ConnectorDetailContent slug={app.connectorSlug} />
                ) : (
                  <Accordion
                    type="multiple"
                    defaultValue={[
                      "description",
                      ...(params.settings ? ["settings"] : []),
                    ]}
                    className="mt-4"
                  >
                    <AccordionItem value="description" className="border-none">
                      <AccordionTrigger>How it works</AccordionTrigger>
                      <AccordionContent className="text-[#878787] text-sm">
                        {app.id === "chatgpt-mcp" ? (
                          <ChatGPTSetupInstructions />
                        ) : app.id === "claude-mcp" ? (
                          <ClaudeSetupInstructions />
                        ) : app.id === "gemini-mcp" ? (
                          <GeminiSetupInstructions />
                        ) : app.id === "windsurf-mcp" ? (
                          <WindsurfSetupInstructions />
                        ) : app.id === "cline-mcp" ? (
                          <ClineSetupInstructions />
                        ) : app.id === "zed-mcp" ? (
                          <ZedSetupInstructions />
                        ) : app.id === "manus-mcp" ? (
                          <ManusSetupInstructions />
                        ) : (
                          <div className="prose prose-sm prose-invert prose-p:text-[#878787] prose-p:my-3 [&_strong]:text-primary [&_strong]:font-normal max-w-none">
                            <MemoizedReactMarkdown>
                              {app.description || app.overview || ""}
                            </MemoizedReactMarkdown>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {app.type === "official" &&
                      app.settings &&
                      app.settings.length > 0 && (
                        <AccordionItem value="settings" className="border-none">
                          <AccordionTrigger>Settings</AccordionTrigger>
                          <AccordionContent className="text-[#878787] text-sm">
                            <AppSettings
                              appId={app.id}
                              settings={app.settings.map((setting) => {
                                const userSetting = Array.isArray(
                                  app.userSettings,
                                )
                                  ? app.userSettings.find(
                                      (us: any) => us.id === setting.id,
                                    )
                                  : null;

                                return {
                                  ...setting,
                                  type: setting.type as
                                    | "switch"
                                    | "text"
                                    | "select",
                                  value: userSetting?.value ?? setting.value,
                                };
                              })}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      )}

                    {app.type === "external" && (
                      <>
                        {app.website && (
                          <AccordionItem
                            value="website"
                            className="border-none"
                          >
                            <AccordionTrigger>Website</AccordionTrigger>
                            <AccordionContent>
                              <a
                                href={app.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline text-[#878787]"
                              >
                                {app.website}
                              </a>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {app.scopes && app.scopes.length > 0 && (
                          <AccordionItem
                            value="permissions"
                            className="border-none"
                          >
                            <AccordionTrigger>Permissions</AccordionTrigger>
                            <AccordionContent>
                              <div className="flex flex-wrap gap-2">
                                {app.scopes.map((scope) => (
                                  <Badge key={scope} variant="tag">
                                    {getScopeDescription(scope).label}
                                  </Badge>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </>
                    )}
                  </Accordion>
                )}
              </ScrollArea>

              <div className="shrink-0 pt-4 border-t border-border">
                <p className="text-[10px] text-[#878787]">
                  All apps on the Midday App Store are open-source and
                  peer-reviewed. Midday Labs AB maintains high standards but
                  doesn't endorse third-party apps. Apps published by Midday are
                  officially certified. Report any concerns about app content or
                  behavior.
                </p>

                <a
                  href="mailto:support@midday.dev"
                  className="text-[10px] text-red-500"
                >
                  Report app
                </a>
              </div>
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
