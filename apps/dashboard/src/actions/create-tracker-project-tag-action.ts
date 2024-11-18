"use server";

import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createTrackerProjectTagSchema } from "./schema";

export const createTrackerProjectTagAction = authActionClient
  .schema(createTrackerProjectTagSchema)
  .metadata({
    name: "create-tracker-project-tag",
    track: {
      event: LogEvents.CreateTrackerProjectTag.name,
      channel: LogEvents.CreateTrackerProjectTag.channel,
    },
  })
  .action(
    async ({
      parsedInput: { tagId, trackerProjectId },
      ctx: { user, supabase },
    }) => {
      const { data } = await supabase.from("tracker_project_tags").insert({
        tag_id: tagId,
        tracker_project_id: trackerProjectId,
        team_id: user.team_id!,
      });

      revalidateTag(`tracker_projects_${user.team_id}`);

      return data;
    },
  );
