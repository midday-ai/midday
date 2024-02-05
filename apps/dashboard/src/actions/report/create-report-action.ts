"use server";

import { action } from "@/actions/safe-action";
import { createReportSchema } from "@/actions/schema";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import Dub from "dub";

const dub = new Dub({ projectSlug: "midday" });

export const createReportAction = action(createReportSchema, async (params) => {
  const supabase = createClient();
  const user = await getUser();

  const { data } = await supabase
    .from("reports")
    .insert({
      team_id: user.data.team_id,
      from: params.from,
      to: params.to,
      type: params.type,
    })
    .select("*")
    .single();

  const link = await dub.links.create({
    url: `${params.baseUrl}/report/${data.id}`,
    rewrite: true,
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
