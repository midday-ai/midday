import { AccountsList } from "@/components/accounts-list";
import { AddAccountButton } from "@/components/add-account-button";
import { ScrollableContent } from "@/components/scrollable-content";
import { HydrateClient, batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Accounts | Abacus",
};

export default async function AccountsPage() {
  batchPrefetch([
    trpc.bankAccounts.get.queryOptions(),
    trpc.bankConnections.get.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-medium">Accounts</h1>
            <AddAccountButton />
          </div>
          <Suspense fallback={<AccountsListSkeleton />}>
            <AccountsList />
          </Suspense>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}

function AccountsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="h-[72px] bg-muted/50 rounded-md animate-pulse"
        />
      ))}
    </div>
  );
}
