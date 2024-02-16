"use server";

import { action } from "@/actions/safe-action";
import { createProjectSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createProject } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const createProjectAction = action(
  createProjectSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { data } = await createProject(supabase, {
      ...params,
      team_id: user.data.team_id,
    });

    revalidateTag(`tracker_projects_${user.data.team_id}`);

    logsnag.track({
      event: LogEvents.ProjectCreated.name,
      icon: LogEvents.ProjectCreated.icon,
      user_id: user.data.email,
      channel: LogEvents.ProjectCreated.channel,
    });

    return data;
  }
);
