import { AccountSettings } from "@/components/account-settings";
import { AccountSettingsSkeleton } from "@/components/account-settings-skeleton";
import { HydrateClient, trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Account Settings | Midday",
};

export default async function Account() {
  const queryClient = getQueryClient();

  queryClient.prefetchQuery(trpc.user.me.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<AccountSettingsSkeleton />}>
        <AccountSettings />
      </Suspense>
    </HydrateClient>
  );
}
