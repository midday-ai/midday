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
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <>
      <div className="flex justify-between sticky top-0 z-10 py-6 backdrop-filter backdrop-blur-lg bg-background/80">
        <Filter sections={sections} />
        <ExportButton />
      </div>

      <Suspense fallback={<Loading />}>
        <Table searchParams={searchParams} />
      </Suspense>
    </>
  );
}
