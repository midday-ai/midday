"use server";

import { action } from "@/actions/safe-action";
import { updateProjectSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateProjectAction = action(
  updateProjectSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { id, ...data } = params;

    await supabase.from("tracker_projects").update(data).eq("id", id);

    revalidateTag(`tracker_projects_${user.data.team_id}`);

    logsnag.track({
      event: LogEvents.ProjectUpdated.name,
      icon: LogEvents.ProjectUpdated.icon,
      user_id: user.data.email,
      channel: LogEvents.ProjectUpdated.channel,
    });
  }
);
