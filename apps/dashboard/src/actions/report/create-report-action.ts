"use server";

import { authActionClient } from "@/actions/safe-action";
import { createReportSchema } from "@/actions/schema";
import { dub } from "@/utils/dub";
import { LogEvents } from "@midday/events/events";

export const createReportAction = authActionClient
  .schema(createReportSchema)
  .metadata({
    name: "create-report",
    track: {
      event: LogEvents.OverviewReport.name,
      channel: LogEvents.OverviewReport.channel,
    },
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { data } = await supabase
      .from("reports")
      .insert({
        team_id: user.team_id,
        from: params.from,
        to: params.to,
        type: params.type,
        expire_at: params.expiresAt,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (!data) {
      return null;
    }

    const link = await dub.links.create({
      url: `${params.baseUrl}/report/${data.id}`,
      expiresAt: params.expiresAt,
    });

    const { data: linkData } = await supabase
      .from("reports")
      .update({
        link_id: link.id,
        short_link: link.shortLink,
      })
      .eq("id", data.id)
      .select("*")
      .single();

    return linkData;
  });
