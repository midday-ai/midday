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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Startup",
  description:
    "We value transparency and aim to keep you informed about our journey every step of the way.",
};

export default async function Page() {
  return (
    <div className="container max-w-[1050px]">
      <h1 className="mt-24 font-medium text-center text-5xl mb-8">
        Open Startup
      </h1>

      <p className="text-[#878787] font-sm text-center max-w-[550px] m-auto">
        We value transparency and aim to keep you informed about our journey
        every step of the way.
      </p>

      <Tabs defaultValue="metrics">
        <TabsList className="p-0 h-auto space-x-6 bg-transparent flex items-center mt-8">
          <TabsTrigger className="p-0 !bg-transparent" value="metrics">
            Metrics
          </TabsTrigger>
          <TabsTrigger className="p-0 !bg-transparent" value="values">
            Company values
          </TabsTrigger>
          <TabsTrigger className="p-0 !bg-transparent" value="table">
            Cap table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="m-0 h-full">
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
        </TabsContent>

        <TabsContent
          value="values"
          className="h-full max-w-[800px] m-auto mt-10"
        >
          <h2 className="text-2xl mb-4">Transparency</h2>
          <p className="mb-10 text-[#878787]">
            We prioritize transparency as we believe it is essential for
            fostering trust and credibility in all aspects of our operations.
            It's not just a value, it's the foundation of our relationships with
            users alike. We prioritize clear and accurate information for users,
            empowering them to make informed decisions confidently. We uphold
            transparency with our users, offering open communication about
            financial performance and strategies to maintain strong, mutually
            beneficial relationships.
          </p>

          <h2 className="text-2xl mb-4">Expectation</h2>
          <p className="mb-10 text-[#878787]">
            Accurately setting expectations is crucial, directly tied to our
            dedication to transparency. We've observed many startups fall short
            due to overpromising, highlighting the importance of aligning
            promises with reality. By maintaining this alignment, we cultivate
            trust and integrity, fostering a culture of accountability guided by
            transparency.
          </p>

          <h2 className="text-2xl mb-4">Strategic Growth</h2>
          <p className="mb-10 text-[#878787]">
            We firmly believe in the potential of assembling the right team to
            build a highly profitable company. However, we also recognize that
            size doesn't necessarily equate to success. Having experienced the
            inefficiencies of overbloated organizations firsthand, we understand
            the importance of agility and efficiency. For us, it's not about the
            number of seats we fill, but rather the quality of individuals we
            bring on board. Hence, our focus lies in growing intelligently,
            prioritizing talent and effectiveness over sheer size.
          </p>
        </TabsContent>

        <TabsContent
          value="table"
          className="h-full max-w-[800px] m-auto mt-10"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Shareholders</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Total shares</TableHead>
                <TableHead className="text-right">% Ownership</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Founders</TableCell>
                <TableCell>0</TableCell>
                <TableCell>100</TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-center mt-4 text-[#878787]">
            Midday Labs AB
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
