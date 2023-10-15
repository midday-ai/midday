import { TransactionsTable } from "@/components/tables/transactions";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <TransactionsTable />
    </Suspense>
  );
}
