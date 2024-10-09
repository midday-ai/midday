import { getUser } from "@midday/supabase/cached-queries";
import { getInvoicesQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { EmptyState, NoResults } from "./empty-states";
import { DataTable } from "./table";

type Props = {
  page: number;
  query?: string | null;
  sort?: string[] | null;
  start?: string | null;
  end?: string | null;
  statuses?: string[] | null;
  customers?: string[] | null;
};

const pageSize = 25;

export async function InvoicesTable({
  query,
  sort,
  start,
  end,
  statuses,
  customers,
  page,
}: Props) {
  const supabase = createClient();
  const { data: userData } = await getUser();

  const filter = {
    start,
    end,
    statuses,
    customers,
  };

  async function loadMore({ from, to }: { from: number; to: number }) {
    "use server";

    const supabase = createClient();

    return getInvoicesQuery(supabase, {
      teamId: userData?.team_id,
      to,
      from: from + 1,
      searchQuery: query,
      sort,
      filter,
    });
  }

  const { data, meta } = await getInvoicesQuery(supabase, {
    teamId: userData?.team_id,
    searchQuery: query,
    sort,
    filter,
    to: pageSize,
  });

  const hasNextPage = Boolean(
    meta?.count && meta.count / (page + 1) > pageSize,
  );

  if (!data?.length) {
    if (
      query?.length ||
      Object.values(filter).some((value) => value !== null)
    ) {
      return <NoResults />;
    }

    return <EmptyState />;
  }

  return (
    <DataTable
      data={data}
      loadMore={loadMore}
      pageSize={pageSize}
      hasNextPage={hasNextPage}
      page={page}
    />
  );
}
