import { TeamsTable } from "@/components/tables/teams/table";
import { getTeams } from "@midday/supabase/cached-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams | Midday",
};

export default async function Teams() {
  const { data } = await getTeams();

  return (
    <div className="space-y-12">
      <TeamsTable data={data} />
    </div>
  );
}
