import { Apps } from "@/components/apps";
import { AppsHeader } from "@/components/apps-header";
import { AppsSkeleton } from "@/components/apps.skeleton";
import {
  HydrateClient,
  batchPrefetch,
  getQueryClient,
  trpc,
} from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Apps | Midday",
};

export default async function Page() {
  const queryClient = getQueryClient();

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
