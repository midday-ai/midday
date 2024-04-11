"use server";

import { action } from "@/actions/safe-action";
import { updateProjectSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
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

    const logsnag = setupLogSnag({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    logsnag.track({
      event: LogEvents.ProjectUpdated.name,
      icon: LogEvents.ProjectUpdated.icon,
      channel: LogEvents.ProjectUpdated.channel,
    });
  }
);
