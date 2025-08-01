import { InboxConnectedAccounts } from "@/components/inbox/inbox-connected-accounts";
import { InboxEmailSettings } from "@/components/inbox/inbox-email-settings";
import { prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox Settings | Midday",
};

export default async function Page() {
  prefetch(trpc.inboxAccounts.get.queryOptions());

  return (
    <div className="max-w-[800px]">
      <main className="mt-8">
        <div className="space-y-12">
          <InboxEmailSettings />
          <InboxConnectedAccounts />
        </div>
      </main>
    </div>
  );
}
