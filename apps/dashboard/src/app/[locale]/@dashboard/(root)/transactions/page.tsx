import { Filter } from "@/components/filter";
import { TransactionsTable } from "@/components/tables/transactions";
import { Button } from "@midday/ui/button";
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
    <div>
      <div className="flex justify-between mb-8 items-center">
        <Filter />
        <Button>Export</Button>
      </div>

      <Suspense fallback={<p>Loading...</p>}>
        <TransactionsTable page={page} />
      </Suspense>
    </div>
  );
}
