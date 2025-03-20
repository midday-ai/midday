import { DataTableV2 } from "@/components/tables/transactions/data-table-v2";
import { Cookies } from "@/utils/constants";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions() {
  const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);

  return (
    <>
      <DataTableV2 />
    </>
  );
}
