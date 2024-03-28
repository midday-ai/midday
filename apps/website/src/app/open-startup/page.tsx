import { BankAccountsChart } from "@/components/charts/bank-accounts-chart";
import { BankConnectionsChart } from "@/components/charts/bank-connections-chart";
import { InboxChart } from "@/components/charts/inbox-chart";
import { ReportsChart } from "@/components/charts/reports-chart";
import { TrackerEntriesChart } from "@/components/charts/tracker-entries-chart";
import { TrackerProjectsChart } from "@/components/charts/tracker-projects-chart";
import { TransactionEnrichmentsChart } from "@/components/charts/transaction-enrichments-chart";
import { TransactionsChart } from "@/components/charts/transactions-chart";
import { UsersChart } from "@/components/charts/users-chart";
import { VaultChart } from "@/components/charts/vault-chart";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Startup | Midday",
};

export default async function Page() {
  return (
    <div className="container max-w-[1050px]">
      <h1 className="mt-24 font-medium text-center text-5xl mb-8">
        Open Startup
      </h1>

      <p className="text-[#878787] font-sm text-center">
        We value transparency and aim to keep you informed about our journey
        every step of the way.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <UsersChart />
        <TransactionsChart />
        <TransactionEnrichmentsChart />
        <BankAccountsChart />
        <BankConnectionsChart />
        <VaultChart />
        <TrackerEntriesChart />
        <TrackerProjectsChart />
        <InboxChart />
        <ReportsChart />
      </div>
    </div>
  );
}
