import { BaseCurrency } from "@/components/base-currency/base-currency";
import { ConnectedAccounts } from "@/components/connected-accounts";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts | Midday",
};

export default async function Page() {
  prefetch(trpc.bankConnections.get.queryOptions());

  return (
    <div className="space-y-12">
      <ConnectedAccounts />
      {/* <BaseCurrency /> */}
    </div>
  );
}
