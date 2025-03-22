import { DataTableV2 } from "@/components/tables/transactions/data-table-v2";
import { Cookies } from "@/utils/constants";
import { HydrateClient, getQueryClient, stRPC } from "@midday/query/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions() {
  // const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);
  const queryClient = getQueryClient();

  queryClient.prefetchQuery(
    stRPC.transactions.getTransactions.queryOptions({
      teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
      to: 10,
      from: 0,
    }),
  );

  return (
    <HydrateClient>
      <DataTableV2 />
    </HydrateClient>
  );
}
