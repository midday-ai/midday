"use server";

import { action } from "@/actions/safe-action";
import { updateEntriesSchema } from "@/actions/schema";
import { LogEvents } from "@midday/events/events";
import { logsnag } from "@midday/events/server";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";

export const updateEntriesAction = action(
  updateEntriesSchema,
  async (params) => {
    const supabase = createClient();
    const user = await getUser();

    const { action, ...payload } = params;

    if (action === "delete") {
      await supabase.from("tracker_entries").delete().eq("id", params.id);
      revalidateTag(`tracker_projects_${user.data.team_id}`);

      return Promise.resolve(params);
    }

    const { data: projectData } = await supabase
      .from("tracker_projects")
      .select("id, rate, currency")
      .eq("id", params.project_id)
      .single();

    const { error } = await supabase.from("tracker_entries").upsert({
      ...payload,
      team_id: user.data.team_id,
      rate: projectData?.rate,
      currency: projectData?.currency,
    });

    if (error) {
      throw Error("Something went wrong.");
    }

    revalidateTag(`tracker_projects_${user.data.team_id}`);
    revalidateTag(`tracker_entries_${user.data.team_id}`);

    logsnag.track({
      event: LogEvents.TrackerCreateEntry.name,
      icon: LogEvents.TrackerCreateEntry.icon,
      user_id: user.data.email,
      channel: LogEvents.TrackerCreateEntry.channel,
    });

    return Promise.resolve(params);
  }
);
