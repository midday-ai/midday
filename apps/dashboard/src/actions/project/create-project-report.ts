"use server";

import { action } from "@/actions/safe-action";
import { createProjectReportSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupLogSnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import Dub from "dub";

const dub = new Dub({ projectSlug: "midday" });

export const createProjectReport = action(
  createProjectReportSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { data } = await supabase
      .from("tracker_reports")
      .insert({
        team_id: user.data.team_id,
        project_id: params.projectId,
      })
      .select("*")
      .single();

    const link = await dub.links.create({
      url: `${params.baseUrl}/report/project/${data.id}`,
      rewrite: true,
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

    const logsnag = await setupLogSnag({
      userId: user.data.id,
      fullName: user.data.full_name,
    });

    logsnag.track({
      event: LogEvents.ProjectReport.name,
      icon: LogEvents.ProjectReport.icon,
      channel: LogEvents.ProjectReport.channel,
    });

    return linkData;
  }
);
