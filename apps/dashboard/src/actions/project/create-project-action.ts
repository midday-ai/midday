"use server";

import { authActionClient } from "@/actions/safe-action";
import { createProjectSchema } from "@/actions/schema";
import { LogEvents } from "@absplatform/events/events";
import { createProject } from "@absplatform/supabase/mutations";
import { revalidateTag } from "next/cache";

export const createProjectAction = authActionClient
  .schema(createProjectSchema)
  .metadata({
    name: "create-project",
    track: {
      event: LogEvents.ProjectCreated.name,
      channel: LogEvents.ProjectCreated.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { data } = await createProject(supabase, {
      ...params,
      team_id: user.team_id,
    });

    revalidateTag(`tracker_projects_${user.team_id}`);

    return data;
  });
