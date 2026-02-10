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
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@midday/ui/carousel";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { useAppOAuth } from "@/hooks/use-app-oauth";
import { useTRPC } from "@/trpc/client";
import { getScopeDescription } from "@/utils/scopes";
import { AppSettings } from "./app-settings";
import { MemoizedReactMarkdown } from "./markdown";

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

interface UnifiedAppProps {
  app: UnifiedApp;
  userEmail?: string;
}

function CarouselWithDots({
  images,
  appName,
}: {
  images: string[];
  appName: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="relative">
      <Carousel className="w-full max-w-[465px]" setApi={setApi}>
        <CarouselContent>
          {images.map((image: string, index: number) => (
            <CarouselItem key={`${appName}-${image}-${index.toString()}`}>
              <Image
                src={image}
                alt={`${appName} screenshot ${index + 1}`}
                width={465}
                height={290}
                quality={100}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Pagination dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((image, index) => (
          <button
            key={`dot-${image}-${index.toString()}`}
            type="button"
            className={`w-2 h-2 rounded-full transition-all ${
              index === current
                ? "bg-white shadow-lg"
                : "bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to screenshot ${index + 1}`}
          />
        ))}
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
    disconnectStripeMutation.isPending;

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

    if (app.type === "official") {
      disconnectOfficialAppMutation.mutate({ appId: app.id });
    } else {
      revokeExternalAppMutation.mutate({ applicationId: app.id });
    }
  };

  const handleOnInitialize = async () => {
    setLoading(true);

    try {
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

          {app.installUrl ? (
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
          )}
        </div>

        <SheetContent>
          <SheetHeader>
            {app.images.length > 0 && (
              <div className="mb-4">
                {app.images.length === 1 ? (
                  <Image
                    src={app.images[0] as string}
                    alt={app.name}
                    width={465}
                    height={290}
                    quality={100}
                  />
                ) : (
                  <CarouselWithDots images={app.images} appName={app.name} />
                )}
              </div>
            )}

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
            </div>

            <div className="mt-4">
              <ScrollArea className="h-[calc(100vh-530px)] pt-2" hideScrollbar>
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
                    <AccordionContent className="text-[#878787] text-sm prose prose-sm prose-invert prose-p:text-[#878787] prose-p:my-3 [&_strong]:text-primary [&_strong]:font-normal max-w-none">
                      <MemoizedReactMarkdown>
                        {app.description || app.overview || ""}
                      </MemoizedReactMarkdown>
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
                              // Find the user setting for this setting ID
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
                        <AccordionItem value="website" className="border-none">
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
              </ScrollArea>

              <div className="absolute bottom-4 pt-8 border-t border-border">
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
