"use server";

import { authActionClient } from "@/actions/safe-action";
import { createProjectSchema } from "@/actions/schema";
import { Cookies } from "@/utils/constants";
import { LogEvents } from "@midday/events/events";
import { createProject } from "@midday/supabase/mutations";
import { addYears } from "date-fns";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export const createProjectAction = authActionClient
  .schema(createProjectSchema)
  .metadata({
    name: "create-project",
    track: {
      event: LogEvents.ProjectCreated.name,
      channel: LogEvents.ProjectCreated.channel,
    },
  })
  .action(
    async ({ parsedInput: { tags, ...params }, ctx: { user, supabase } }) => {
      const { data } = await createProject(supabase, {
        ...params,
        team_id: user.team_id!,
      });

      if (!data) {
        throw new Error("Failed to create project");
      }

      if (tags?.length) {
        await supabase.from("tracker_project_tags").insert(
          tags.map((tag) => ({
            tag_id: tag.id,
            tracker_project_id: data?.id,
            team_id: user.team_id!,
          })),
        );
      }

      cookies().set({
        name: Cookies.LastProject,
        value: data.id,
        expires: addYears(new Date(), 1),
      });

      revalidateTag(`tracker_projects_${user.team_id}`);

      return data;
    },
  );
