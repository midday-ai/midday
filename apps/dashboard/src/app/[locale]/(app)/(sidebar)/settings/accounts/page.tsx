import type { Metadata } from "next";
import { ConnectedAccounts } from "@/components/connected-accounts";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Bank Connections | Midday",
};

export default async function Page() {
  prefetch(trpc.bankConnections.get.queryOptions());
  prefetch(trpc.bankAccounts.get.queryOptions({ manual: true }));

  return (
    <div className="space-y-12">
      <ConnectedAccounts />
    </div>
  );
}
