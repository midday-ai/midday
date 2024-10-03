"use server";

import { authActionClient } from "@/actions/safe-action";
import { deleteProjectSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export const deleteProjectAction = authActionClient
  .schema(deleteProjectSchema)
  .metadata({
    name: "delete-project",
    track: {
      event: LogEvents.ProjectDeleted.name,
      channel: LogEvents.ProjectDeleted.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    await supabase.from("tracker_projects").delete().eq("id", params.id);

    cookies().delete(Cookies.LastProject);

    revalidateTag(`tracker_projects_${user.team_id}`);
  });
