import { ExportButton } from "@/components/export-button";
import { Filter } from "@/components/filter";
import { Table } from "@/components/tables/transactions";
import { sections } from "@/components/tables/transactions/filters";
import { Loading } from "@/components/tables/transactions/loading";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = !params?.pagination ? 0 : parseInt(params.pagination[0]!);
  const filter =
    (searchParams?.filter && JSON.parse(searchParams.filter)) ?? {};

  return (
    <>
      <div className="flex justify-between sticky top-0 z-10 py-6 backdrop-filter backdrop-blur-lg bg-background/80">
        <Filter sections={sections} />
        <ExportButton />
      </div>

      <Suspense fallback={<Loading />}>
        <Table filter={filter} page={page} />
      </Suspense>
    </>
  );
}
