import { DataTableV2 } from "@/components/tables/transactions/data-table-v2";
import { Cookies } from "@/utils/constants";
import { getTransactions } from "@midday/query/queries";
import { getQueryClient } from "@midday/query/query-client";
import { HydrationBoundary, dehydrate } from "@midday/query/server";
import { createClient } from "@midday/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Transactions | Midday",
};

export default async function Transactions() {
  // const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);

  const queryClient = getQueryClient();
  const supabase = createClient();

  // look ma, no await
  queryClient.prefetchQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      getTransactions(supabase, {
        teamId: "dd6a039e-d071-423a-9a4d-9ba71325d890",
        to: 10,
        from: 0,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DataTableV2 />
    </HydrationBoundary>
  );
}
