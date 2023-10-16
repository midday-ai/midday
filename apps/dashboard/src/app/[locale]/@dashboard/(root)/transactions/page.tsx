import { Filter } from "@/components/filter";
import { sections } from "@/components/filters/transactions";
import { TransactionsTable } from "@/components/tables/transactions";
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
  const page = typeof searchParams.page === "string" ? +searchParams.page : 1;

  return (
    <div className="space-y-8">
      <Filter sections={sections} />
      <Suspense fallback={<p>Loading...</p>}>
        <TransactionsTable page={page} />
      </Suspense>
    </div>
  );
}
