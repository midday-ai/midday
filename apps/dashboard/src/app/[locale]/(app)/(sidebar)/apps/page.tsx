import { Apps } from "@/components/apps";
import { AppsHeader } from "@/components/apps-header";
import { AppsSkeleton } from "@/components/apps.skeleton";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  const queryClient = getQueryClient();

  // Change this to prefetch once this is fixed: https://github.com/trpc/trpc/issues/6632
  await Promise.all([
    queryClient.fetchQuery(trpc.apps.get.queryOptions()),
    queryClient.fetchQuery(trpc.oauthApplications.list.queryOptions()),
    queryClient.fetchQuery(trpc.oauthApplications.authorized.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <div className="mt-4">
        <AppsHeader />

        <Suspense fallback={<AppsSkeleton />}>
          <Apps />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
