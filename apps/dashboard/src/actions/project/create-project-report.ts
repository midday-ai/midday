"use server";

import { authActionClient } from "@/actions/safe-action";
import { createProjectReportSchema } from "@/actions/schema";
import { dub } from "@/utils/dub";
import { LogEvents } from "@midday/events/events";

export const createProjectReport = authActionClient
  .schema(createProjectReportSchema)
  .metadata({
    name: "create-project-report",
    track: {
      event: LogEvents.ProjectReport.name,
      channel: LogEvents.ProjectReport.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { data } = await supabase
      .from("tracker_reports")
      .insert({
        team_id: user.team_id,
        project_id: params.projectId,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (!data) {
      return;
    }

    const link = await dub.links.create({
      url: `${params.baseUrl}/report/project/${data?.id}`,
    });

    const { data: linkData } = await supabase
      .from("tracker_reports")
      .update({
        link_id: link.id,
        short_link: link.shortLink,
      })
      .eq("id", data.id)
      .select("*")
      .single();

    return linkData;
  });
