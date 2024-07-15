"use server";

import { authActionClient } from "@/actions/safe-action";
import { createProjectReportSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { Dub } from "dub";

const dub = new Dub({ projectSlug: "midday" });

export const createProjectReport = authActionClient
  .schema(createProjectReportSchema)
  .action(async ({ parsedInput: params, ctx: { user } }) => {
    const supabase = createClient();

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

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.ProjectReport.name,
      channel: LogEvents.ProjectReport.channel,
    });

    return linkData;
  });
