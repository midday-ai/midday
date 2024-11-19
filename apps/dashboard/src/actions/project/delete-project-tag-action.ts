"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "../safe-action";
import { deleteProjectTagSchema } from "../schema";

export const deleteProjectTagAction = authActionClient
  .schema(deleteProjectTagSchema)
  .metadata({
    name: "delete-project-tag",
    track: {
      event: LogEvents.DeleteProjectTag.name,
      channel: LogEvents.DeleteProjectTag.channel,
    },
  })
  .action(
    async ({ parsedInput: { tagId, projectId }, ctx: { user, supabase } }) => {
      const { data } = await supabase
        .from("tracker_project_tags")
        .delete()
        .eq("tracker_project_id", projectId)
        .eq("tag_id", tagId);

      revalidateTag(`tracker_projects_${user.team_id}`);

      return data;
    },
  );
