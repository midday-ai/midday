"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateProjectSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";

export const updateProjectAction = authActionClient
  .schema(updateProjectSchema)
  .metadata({
    event: LogEvents.ProjectUpdated.name,
    channel: LogEvents.ProjectUpdated.channel,
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { id, ...data } = params;

    await supabase.from("tracker_projects").update(data).eq("id", id);

    revalidateTag(`tracker_projects_${user.team_id}`);
  });
