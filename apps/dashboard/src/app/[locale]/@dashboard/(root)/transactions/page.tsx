import { columns } from "@/components/tables/transactions/columns";
import { DataTable } from "@/components/tables/transactions/data-table";
// import { getTransactions } from "@midday/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions() {
  return null;
  // const data = await getTransactions({ from: 0, to: 25 });
  // return <DataTable columns={columns} data={data} />;
}
