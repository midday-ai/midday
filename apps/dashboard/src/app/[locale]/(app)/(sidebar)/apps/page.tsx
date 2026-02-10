import type { Metadata } from "next";
import { Suspense } from "react";
import { Apps } from "@/components/apps";
import { AppsSkeleton } from "@/components/apps.skeleton";
import { AppsHeader } from "@/components/apps-header";
import {
  batchPrefetch,
  getQueryClient,
  HydrateClient,
  trpc,
} from "@/trpc/server";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  const _queryClient = getQueryClient();

  batchPrefetch([
    trpc.apps.get.queryOptions(),
    trpc.oauthApplications.list.queryOptions(),
    trpc.oauthApplications.authorized.queryOptions(),
    trpc.inboxAccounts.get.queryOptions(),
    trpc.invoicePayments.stripeStatus.queryOptions(),
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
