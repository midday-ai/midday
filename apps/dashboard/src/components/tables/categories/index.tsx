import { getTeamUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { DataTable } from "./table";

export async function CategoriesTable() {
  const supabase = createClient();
  const user = await getTeamUser();

  const { data } = await supabase
    .from("transaction_categories")
    .select("id, name")
    .eq("team_id", user.data?.team_id);

  return <DataTable data={data} />;
}
