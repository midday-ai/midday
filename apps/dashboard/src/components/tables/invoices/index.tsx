import { getUser } from "@midday/supabase/cached-queries";
import { getInvoicesQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { EmptyState, NoResults } from "./empty-states";
import { DataTable } from "./table";

type Props = {
  query?: string | null;
  sort?: string[] | null;
  start?: string | null;
  end?: string | null;
  statuses?: string[] | null;
  customers?: string[] | null;
};

export async function InvoicesTable({
  query,
  sort,
  start,
  end,
  statuses,
  customers,
}: Props) {
  const supabase = createClient();
  const { data: userData } = await getUser();

  const { data } = await getInvoicesQuery(supabase, {
    teamId: userData?.team_id,
    searchQuery: query,
    sort,
    filter: {
      start,
      end,
      statuses,
      customers,
    },
  });

  if (!data?.length) {
    if (query?.length) {
      return <NoResults />;
    }

    return <EmptyState />;
  }

  return <DataTable data={data} />;
}
