import { getUser } from "@midday/supabase/cached-queries";
import { getInvoicesQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { DataTable } from "./table";

type Props = {
  query: string;
  sort: string[];
};

export async function InvoicesTable({ query, sort }: Props) {
  const supabase = createClient();
  const { data: userData } = await getUser();

  const { data } = await getInvoicesQuery(supabase, {
    teamId: userData?.team_id,
    searchQuery: query,
    sort,
  });

  return <DataTable data={data} />;
}
