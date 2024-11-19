"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "../safe-action";
import { createProjectTagSchema } from "../schema";

export const createProjectTagAction = authActionClient
  .schema(createProjectTagSchema)
  .metadata({
    name: "create-project-tag",
    track: {
      event: LogEvents.CreateProjectTag.name,
      channel: LogEvents.CreateProjectTag.channel,
    },
  })
  .action(
    async ({ parsedInput: { tagId, projectId }, ctx: { user, supabase } }) => {
      const { data } = await supabase.from("tracker_project_tags").insert({
        tag_id: tagId,
        tracker_project_id: projectId,
        team_id: user.team_id!,
      });

      revalidateTag(`tracker_projects_${user.team_id}`);

      return data;
    },
  );
