"use client";

import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { apps } from "@midday/app-store";
import { Button } from "@midday/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { App } from "./app";

export function Apps() {
  const trpc = useTRPC();
  const { data: installedApps } = useSuspenseQuery(
    trpc.apps.installed.queryOptions(),
  );

  const { data: user } = useUserQuery();

  const searchParams = useSearchParams();
  const isInstalledPage = searchParams.get("tab") === "installed";
  const search = searchParams.get("q");
  const router = useRouter();

  const filteredApps = apps
    .filter((app) => !isInstalledPage || installedApps.includes(app.id))
    .filter(
      (app) => !search || app.name.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mx-auto mt-8">
      {filteredApps.map((app) => (
        <App
          key={app.id}
          installed={installedApps?.includes(app.id)}
          {...app}
          userSettings={
            installedApps.find((setting) => setting?.app_id === app.id)
              ?.settings ?? []
          }
          onInitialize={() => app.onInitialize(user)}
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
