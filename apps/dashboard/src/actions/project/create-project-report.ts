"use server";

import { action } from "@/actions/safe-action";
import { createProjectReportSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { Dub } from "dub";

const dub = new Dub({ projectSlug: "midday" });

export const createProjectReport = action(
  createProjectReportSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { data } = await supabase
      .from("tracker_reports")
      .insert({
        team_id: user?.data?.team_id,
        project_id: params.projectId,
        created_by: user?.data?.id,
      })
      .select("*")
      .single();

    const link = await dub.links.create({
      url: `${params.baseUrl}/report/project/${data?.id}`,
      // rewrite: true,
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
      userId: user?.data?.id,
      fullName: user?.data?.full_name,
    });

    analytics.track({
      event: LogEvents.ProjectReport.name,
      channel: LogEvents.ProjectReport.channel,
    });

    return linkData;
  }
);
