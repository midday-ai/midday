"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateEntriesSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { revalidateTag } from "next/cache";

export const updateEntriesAction = authActionClient
  .schema(updateEntriesSchema)
  .metadata({
    event: LogEvents.TrackerCreateEntry.name,
    channel: LogEvents.TrackerCreateEntry.channel,
  })
  .action(async ({ parsedInput: params, ctx: { user, supabase } }) => {
    const { action, ...payload } = params;

    if (action === "delete") {
      await supabase.from("tracker_entries").delete().eq("id", params.id);
      revalidateTag(`tracker_projects_${user.team_id}`);

      return Promise.resolve(params);
    }

    const { data: projectData } = await supabase
      .from("tracker_projects")
      .select("id, rate, currency")
      .eq("id", params.project_id)
      .single();

    const { error } = await supabase.from("tracker_entries").upsert({
      ...payload,
      team_id: user.team_id,
      rate: projectData?.rate,
      currency: projectData?.currency,
    });

    if (error) {
      throw Error("Something went wrong.");
    }

    revalidateTag(`tracker_projects_${user.team_id}`);
    revalidateTag(`tracker_entries_${user.team_id}`);

    return Promise.resolve(params);
  });
