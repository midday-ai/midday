"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { apps as appStoreApps } from "@midday/app-store";
import type { UnifiedApp } from "@midday/app-store/types";
import { Button } from "@midday/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedAppComponent } from "./unified-app";

export function Apps() {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const router = useRouter();

  // Fetch from both endpoints
  const { data: installedOfficialApps } = useSuspenseQuery(
    trpc.apps.get.queryOptions(),
  );

  const { data: externalAppsData } = useSuspenseQuery(
    trpc.oauthApplications.list.queryOptions(),
  );

  const { data: authorizedExternalApps } = useSuspenseQuery(
    trpc.oauthApplications.authorized.queryOptions(),
  );

  const searchParams = useSearchParams();
  const isInstalledPage = searchParams.get("tab") === "installed";
  const search = searchParams.get("q");

  // Transform official apps
  const transformedOfficialApps: UnifiedApp[] = appStoreApps.map((app) => ({
    id: app.id,
    name: app.name,
    category: "category" in app ? app.category : "Integration",
    active: app.active,
    logo: app.logo,
    short_description: app.short_description,
    description: app.description || undefined,
    images: app.images || [],
    installed:
      installedOfficialApps?.some((installed) => installed.app_id === app.id) ??
      false,
    type: "official" as const,
    onInitialize:
      "onInitialize" in app && typeof app.onInitialize === "function"
        ? async () => {
            const result = app.onInitialize();
            return result instanceof Promise ? result : Promise.resolve(result);
          }
        : undefined,
    settings:
      "settings" in app && Array.isArray(app.settings)
        ? app.settings
        : undefined,
    userSettings:
      (installedOfficialApps?.find((installed) => installed.app_id === app.id)
        ?.settings as Record<string, any>) || undefined,
  }));

  // Transform external apps (only approved ones)
  const approvedExternalApps =
    externalAppsData?.data?.filter((app) => app.status === "approved") || [];
  const transformedExternalApps: UnifiedApp[] = approvedExternalApps.map(
    (app) => ({
      id: app.id,
      name: app.name,
      category: "Integration",
      active: app.active ?? false, // Convert null to boolean
      logo: app.logoUrl || undefined, // Convert null to undefined
      short_description: app.description || undefined, // Convert null to undefined
      description: app.overview || app.description || undefined, // Convert null to undefined
      images: app.screenshots || [],
      installed:
        authorizedExternalApps?.data?.some(
          (authorized) => authorized.id === app.id,
        ) ?? false,
      type: "external" as const,
      clientId: app.clientId || undefined, // Convert null to undefined
      scopes: app.scopes || undefined, // Convert null to undefined
      developerName: app.developerName || undefined, // Convert null to undefined
      website: app.website || undefined, // Convert null to undefined
      installUrl: app.installUrl || undefined, // Convert null to undefined
      screenshots: app.screenshots || undefined, // Convert null to undefined
      overview: app.overview || undefined, // Convert null to undefined
      createdAt: app.createdAt || undefined, // Convert null to undefined
      status: app.status || undefined, // Convert null to undefined
      lastUsedAt:
        authorizedExternalApps?.data?.find(
          (authorized) => authorized.id === app.id,
        )?.lastUsedAt || undefined, // Convert null to undefined
    }),
  );

  // Combine all apps
  const allApps = [...transformedOfficialApps, ...transformedExternalApps];

  // Filter apps
  const filteredApps = allApps
    .filter((app) => !isInstalledPage || app.installed)
    .filter(
      (app) => !search || app.name.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mx-auto mt-8">
      {filteredApps.map((app) => (
        <UnifiedAppComponent
          key={app.id}
          app={app}
          userEmail={user?.email || undefined}
        />
      ))}

      {!search && !filteredApps.length && (
        <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-400px)]">
          <h3 className="text-lg font-semibold text-[#1D1D1D] dark:text-[#F2F1EF]">
            No apps installed
          </h3>
          <p className="mt-2 text-sm text-[#878787] text-center max-w-md">
            You haven't installed any apps yet. Go to the 'All Apps' tab to
            browse available apps.
          </p>
        </div>
      )}

      {search && !filteredApps.length && (
        <div className="col-span-full flex flex-col items-center justify-center h-[calc(100vh-400px)]">
          <h3 className="text-lg font-semibold text-[#1D1D1D] dark:text-[#F2F1EF]">
            No apps found
          </h3>
          <p className="mt-2 text-sm text-[#878787] text-center max-w-md">
            No apps found for your search, let us know if you want to see a
            specific app in the app store.
          </p>

          <Button
            onClick={() => router.push("/apps")}
            className="mt-4"
            variant="outline"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}
