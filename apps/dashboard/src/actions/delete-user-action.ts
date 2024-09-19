"use server";

import { LogEvents } from "@absplatform/events/events";
import { setupAnalytics } from "@absplatform/events/server";
import { getUser } from "@absplatform/supabase/cached-queries";
import { deleteUser } from "@absplatform/supabase/mutations";
import { createClient } from "@absplatform/supabase/server";
import { LoopsClient } from "loops";
import { redirect } from "next/navigation";

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

export const deleteUserAction = async () => {
  const supabase = createClient();
  const user = await getUser();

  const { data: membersData } = await supabase
    .from("users_on_team")
    .select("team_id, team:team_id(id, name, members:users_on_team(id))")
    .eq("user_id", user?.data?.id);

  const teamIds = membersData
    ?.filter(({ team }) => team?.members.length === 1)
    .map(({ team_id }) => team_id);

  if (teamIds?.length) {
    // Delete all teams with only one member
    await supabase.from("teams").delete().in("id", teamIds);
  }

  const userId = await deleteUser(supabase);

  await loops.deleteContact({ userId });

  const analytics = await setupAnalytics({
    userId,
  });

  analytics.track({
    event: LogEvents.DeleteUser.name,
    user_id: userId,
    channel: LogEvents.DeleteUser.channel,
  });

  redirect("/");
};
