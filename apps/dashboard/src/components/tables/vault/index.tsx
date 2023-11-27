import { getVault } from "@midday/supabase/cached-queries";
import { DataTable } from "./data-table";

export async function Table({ path }) {
  const { data } = await getVault({ path });

  return (
    <div className="mt-8">
      <DataTable data={data} />
    </div>
  );
}
