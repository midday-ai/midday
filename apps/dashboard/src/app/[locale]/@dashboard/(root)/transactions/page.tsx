import { ExportButton } from "@/components/export-button";
import { Filter } from "@/components/filter";
import { TransactionsModal } from "@/components/modals/transactions-modal";
import { Table } from "@/components/tables/transactions";
import { sections } from "@/components/tables/transactions/filters";
import { Loading } from "@/components/tables/transactions/loading";
import { getBankConnectionsByTeamId } from "@midday/supabase/cached-queries";
import { cn } from "@midday/ui/utils";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { data } = await getBankConnectionsByTeamId();
  const page = typeof searchParams.page === "string" ? +searchParams.page : 0;
  const transactionId = searchParams?.id;
  const filter =
    (searchParams?.filter && JSON.parse(searchParams.filter)) ?? {};
  const sort = searchParams?.sort?.split(":");

  const isOpen = Boolean(searchParams.step);
  const empty = !data?.length && !isOpen;

  return (
    <>
      <div className="flex justify-between py-6">
        <Filter sections={sections} />
        <ExportButton />
      </div>

      <div className={cn(empty && "opacity-20 pointer-events-none")}>
        <Suspense fallback={<Loading collapsed={Boolean(transactionId)} />}>
          <Table filter={filter} page={page} sort={sort} noAccounts={empty} />
        </Suspense>
      </div>

      {empty && <TransactionsModal />}
    </>
  );
}
