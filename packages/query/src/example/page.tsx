import { createClient } from "@midday/supabase/server";
import { getTransactions } from "../queries/transactions";
import { getQueryClient } from "../query-client";
import { HydrationBoundary, dehydrate } from "../server";

export default function PostsPage() {
  const queryClient = getQueryClient();
  const supabase = createClient();

  // look ma, no await
  queryClient.prefetchQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1>Example</h1>
    </HydrationBoundary>
  );
}
