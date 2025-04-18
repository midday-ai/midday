import { getTeamLimitsMetricsQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Usage } from "./usage";

export async function UsageServer({
  teamId,
  plan,
}: {
  teamId: string;
  plan: string;
}) {
  const supabase = await createClient();

  const { data } = await getTeamLimitsMetricsQuery(supabase, teamId);

  return <Usage data={data} plan={plan} />;
}
