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

  const filter = {
    start,
    end,
    statuses,
    customers,
  };

  const { data } = await getInvoicesQuery(supabase, {
    teamId: userData?.team_id,
    searchQuery: query,
    sort,
    filter,
  });

  if (!data?.length) {
    if (
      query?.length ||
      Object.values(filter).some((value) => value !== null)
    ) {
      return <NoResults />;
    }

    return <EmptyState />;
  }

  return <DataTable data={data} />;
}
