import { createClient } from "@midday/supabase/server";
import { Apps } from "./apps";

export async function AppsServer({ user }: { user: User }) {
  const supabase = createClient();

  const { data } = await supabase
    .from("apps")
    .select("app_id")
    .eq("team_id", user.team_id);

  return (
    <Apps installedApps={data?.map((app) => app.app_id) ?? []} user={user} />
  );
}
