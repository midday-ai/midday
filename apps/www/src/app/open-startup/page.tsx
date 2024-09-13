import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Open Startup",
};

export default async function Page() {
  return (
    <div className="container max-w-[1050px]">
      <h1 className="mb-8 mt-24 text-center text-5xl font-medium">
        Open Startup
      </h1>

      <p className="font-sm m-auto max-w-[550px] text-center text-[#878787]">
        We value transparency and aim to keep you informed about our journey
        every step of the way.
      </p>

      <Tabs defaultValue="metrics">
        <TabsList className="mt-8 flex h-auto items-center space-x-6 bg-transparent p-0">
          <TabsTrigger className="!bg-transparent p-0" value="metrics">
            Metrics
          </TabsTrigger>
          <TabsTrigger className="!bg-transparent p-0" value="values">
            Company values
          </TabsTrigger>
          <TabsTrigger className="!bg-transparent p-0" value="table">
            Cap table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="m-0 h-full">
          <div className="mt-12 grid gap-6 md:grid-cols-2">
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
          className="m-auto mt-10 h-full max-w-[800px]"
        >
          <h2 className="mb-4 text-2xl">Transparency</h2>
          <p className="mb-10 text-[#878787]">
            We prioritize transparency as we believe it is essential for
            fostering trust and credibility in all aspects of our operations.
            It's not just a value, it's the foundation of our relationships with
            users and investors alike. We prioritize clear and accurate
            information for users, empowering them to make informed decisions
            confidently. We uphold transparency with investors, offering open
            communication about financial performance and strategies to maintain
            strong, mutually beneficial relationships.
          </p>

          <h2 className="mb-4 text-2xl">Expectation</h2>
          <p className="mb-10 text-[#878787]">
            Accurately setting expectations is crucial, directly tied to our
            dedication to transparency. This applies not just to users but also
            to investors. We've observed many startups fall short due to
            overpromising, highlighting the importance of aligning promises with
            reality. By maintaining this alignment, we cultivate trust and
            integrity, fostering a culture of accountability guided by
            transparency.
          </p>

          <h2 className="mb-4 text-2xl">Strategic Growth</h2>
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
          className="m-auto mt-10 h-full max-w-[800px]"
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
                <TableCell>Yoan Yomba</TableCell>
                <TableCell>0</TableCell>
                <TableCell>3,000,000</TableCell>
                <TableCell className="text-right">30%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Alexis Serra</TableCell>
                <TableCell>0</TableCell>
                <TableCell>3,000,000</TableCell>
                <TableCell className="text-right">30%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Yvan Yomba</TableCell>
                <TableCell>0</TableCell>
                <TableCell>3,000,000</TableCell>
                <TableCell className="text-right">30%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Not Allocated</TableCell>
                <TableCell>0</TableCell>
                <TableCell>1,000,000</TableCell>
                <TableCell className="text-right">10%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-4 text-center text-xs text-[#878787]">
            Solomon AI Share Distribution
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
