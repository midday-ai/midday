"use server";

import { authActionClient } from "@/actions/safe-action";
import { createReportSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { createClient } from "@midday/supabase/server";
import { Dub } from "dub";

const dub = new Dub({ projectSlug: "midday" });

export const createReportAction = authActionClient
  .schema(createReportSchema)
  .action(async ({ parsedInput: params, ctx: { user } }) => {
    const supabase = createClient();

    const { data } = await supabase
      .from("reports")
      .insert({
        team_id: user.team_id,
        from: params.from,
        to: params.to,
        type: params.type,
        expire_at: params.expiresAt,
        currency: params.currency,
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

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.full_name,
    });

    analytics.track({
      event: LogEvents.OverviewReport.name,
      channel: LogEvents.OverviewReport.channel,
    });

    return linkData;
  });
